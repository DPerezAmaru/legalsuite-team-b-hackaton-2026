import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div className='text-fg-primary'>Dashboard</div>,
})
