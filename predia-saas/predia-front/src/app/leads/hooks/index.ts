import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadsService } from '../services/leads.service'
import {
  leadKeys,
  type CreateLeadRequest,
  type LeadFilters,
  type UpdateLeadRequest,
} from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

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

export const useUpdateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateLeadRequest & { id: string }) =>
      leadsService.update(id, payload),
    onSuccess: (_, { id }) => {
      notify.success({ title: 'Lead actualizado' })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al actualizar lead', description: extractApiError(err) })
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
