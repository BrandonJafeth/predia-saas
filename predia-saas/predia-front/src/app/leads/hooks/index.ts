import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { leadsService } from '../services/leads.service'
import {
  leadKeys,
  type CreateLeadActivityRequest,
  type CreateLeadRequest,
  type Lead,
  type LeadActivity,
  type LeadActivityFilters,
  type LeadDetail,
  type LeadFilters,
  type PaginatedResponse,
  type UpdateLeadRequest,
} from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'
import { useCurrentUser } from '@/app/auth/hooks'

export const useLeads = (filters?: LeadFilters) => {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadsService.findAll(filters),
  })
}

export const useLead = (id: string) => {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsService.findOne(id),
    enabled: !!id,
  })
}

export const useCreateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeadRequest) => leadsService.create(payload),
    onSuccess: () => {
      notify.success({ title: 'Lead creado' })
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear lead', description: extractApiError(err) })
    },
  })
}

interface UpdateLeadContext {
  previousLead?: LeadDetail
  previousLists: Array<[readonly unknown[], PaginatedResponse<Lead> | undefined]>
}

export const useUpdateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateLeadRequest & { id: string }) =>
      leadsService.update(id, payload),

    onMutate: async ({ id, ...payload }): Promise<UpdateLeadContext> => {
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })

      const previousLead = queryClient.getQueryData<LeadDetail>(leadKeys.detail(id))
      if (previousLead) {
        queryClient.setQueryData<LeadDetail>(leadKeys.detail(id), { ...previousLead, ...payload })
      }

      const previousLists = queryClient.getQueriesData<PaginatedResponse<Lead>>({
        queryKey: leadKeys.lists(),
      })
      queryClient.setQueriesData<PaginatedResponse<Lead>>(
        { queryKey: leadKeys.lists() },
        (old) =>
          old
            ? { ...old, data: old.data.map((lead) => (lead.id === id ? { ...lead, ...payload } : lead)) }
            : old,
      )

      return { previousLead, previousLists }
    },

    onError: (err, { id }, context) => {
      if (context?.previousLead) queryClient.setQueryData(leadKeys.detail(id), context.previousLead)
      context?.previousLists.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      notify.error({ title: 'Error al actualizar lead', description: extractApiError(err) })
    },

    onSuccess: () => {
      notify.success({ title: 'Lead actualizado' })
    },

    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export const useArchiveLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadsService.remove(id),
    onSuccess: () => {
      notify.success({ title: 'Lead archivado' })
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al archivar lead', description: extractApiError(err) })
    },
  })
}

// Borrado lógico: el backend archiva el lead (DELETE /leads/{id}) en vez de
// eliminarlo físicamente. Alias para consumidores que esperan "delete".
export const useDeleteLead = useArchiveLead

export const useLeadActivities = (leadId: string, filters?: LeadActivityFilters) => {
  return useQuery({
    queryKey: leadKeys.activityList(leadId, filters),
    queryFn: () => leadsService.findActivities(leadId, filters),
    enabled: !!leadId,
  })
}

export const ACTIVITIES_PAGE_SIZE = 10

// "Cargar más" — la lista completa (a diferencia de la vista embebida en
// LeadDetail, capada a 10) se pagina con useInfiniteQuery para acumular
// páginas en cache sin refetchear las anteriores.
export const useLeadActivitiesInfinite = (leadId: string) => {
  return useInfiniteQuery({
    queryKey: leadKeys.activityList(leadId, { limit: ACTIVITIES_PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      leadsService.findActivities(leadId, { page: pageParam, limit: ACTIVITIES_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined),
    enabled: !!leadId,
  })
}

interface CreateActivityContext {
  previousPages?: InfiniteData<PaginatedResponse<LeadActivity>>
}

export const useCreateLeadActivity = (leadId: string) => {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const queryKey = leadKeys.activityList(leadId, { limit: ACTIVITIES_PAGE_SIZE })

  return useMutation({
    mutationFn: (payload: CreateLeadActivityRequest) => leadsService.createActivity(leadId, payload),

    onMutate: async (payload): Promise<CreateActivityContext> => {
      await queryClient.cancelQueries({ queryKey })

      const previousPages = queryClient.getQueryData<InfiniteData<PaginatedResponse<LeadActivity>>>(queryKey)

      if (previousPages && currentUser) {
        const optimisticActivity: LeadActivity = {
          id: `optimistic-${Date.now()}`,
          lead_id: leadId,
          tenant_id: currentUser.tenant_id,
          type: payload.type,
          description: payload.description,
          created_by: currentUser.id,
          creator: {
            id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            email: currentUser.email,
          },
          created_at: new Date().toISOString(),
        }

        queryClient.setQueryData<InfiniteData<PaginatedResponse<LeadActivity>>>(queryKey, (old) => {
          if (!old) return old
          const [firstPage, ...restPages] = old.pages
          if (!firstPage) return old
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                data: [optimisticActivity, ...firstPage.data],
                meta: { ...firstPage.meta, itemCount: firstPage.meta.itemCount + 1 },
              },
              ...restPages,
            ],
          }
        })
      }

      return { previousPages }
    },

    onError: (err, _payload, context) => {
      if (context?.previousPages) queryClient.setQueryData(queryKey, context.previousPages)
      notify.error({ title: 'Error al registrar actividad', description: extractApiError(err) })
    },

    onSuccess: () => {
      notify.success({ title: 'Actividad registrada' })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.activities(leadId) })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    },
  })
}
