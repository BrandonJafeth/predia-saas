import { Component, type ReactNode } from 'react'
import ErrorPage from '@/app/errors/ErrorPage'
import { router } from '@/router'

interface Props {
  children: ReactNode
}

interface State {
  error: unknown
}

// Last-resort safety net: catches errors that slip past TanStack Router's
// own per-route error boundaries (e.g. an internal router race during a
// beforeLoad redirect throwing a non-Error value), so the app never goes
// to a blank white screen. Such races are transient, so we remount the
// tree once automatically before showing the error screen to the user.
class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  private autoRetried = false

  static getDerivedStateFromError(error: unknown): Pick<State, 'error'> {
    return { error }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('Uncaught error rendering app:', error, info.componentStack)
    if (!this.autoRetried) {
      this.autoRetried = true
      this.recover()
    }
  }

  // Remounting React alone isn't enough: the router keeps its own match
  // cache in a module-level singleton, independent of the component tree.
  // A stuck match (e.g. status "redirected" with its promise already
  // cleared) has to be force-invalidated there too, or the same match
  // just throws again on the next render.
  recover() {
    router.invalidate({ forcePending: true }).finally(() => {
      this.setState({ error: null })
    })
  }

  reset = () => {
    this.autoRetried = false
    this.recover()
  }

  render() {
    if (this.state.error !== null) {
      return <ErrorPage error={this.state.error} reset={this.reset} />
    }
    return this.props.children
  }
}

export default AppErrorBoundary
