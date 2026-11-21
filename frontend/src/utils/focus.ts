// Moves focus to the first field marked invalid inside a form, so keyboard and
// screen reader users land on the problem after a failed save.
export function focusFirstInvalid(formId: string): void {
  const field = document.getElementById(formId)?.querySelector<HTMLElement>('[aria-invalid="true"]')
  field?.focus()
}
