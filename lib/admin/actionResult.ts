export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function actionError(error: unknown): ActionResult<never> {
  const message =
    error instanceof Error ? error.message : 'Something went wrong.'
  return { ok: false, error: message }
}

// redirect() throws NEXT_REDIRECT internally — callers must rethrow so navigation propagates.
export function isRedirectError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('NEXT_REDIRECT')
}
