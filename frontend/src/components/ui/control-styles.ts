export const controlClasses = [
  'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
  'placeholder:text-slate-400',
  'focus:outline-2 focus:outline-offset-0 focus:outline-brand-600',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

export function borderClasses(invalid: boolean): string {
  return invalid ? 'border-red-400 focus:outline-red-500' : 'border-slate-300'
}
