import { clsx } from 'clsx'

export function Table({ className, children, ...props }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/08">
      <table
        className={clsx('w-full text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className, children, ...props }) {
  return (
    <thead className={clsx('bg-surface/50 border-b border-white/08', className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={clsx('divide-y divide-white/05', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className, onClick, children, ...props }) {
  return (
    <tr
      className={clsx(
        'transition-colors',
        onClick ? 'cursor-pointer hover:bg-white/03' : 'hover:bg-white/02',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHeader({ className, children, ...props }) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }) {
  return (
    <td
      className={clsx('px-4 py-3 text-gray-300 whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </td>
  )
}

export default Table
