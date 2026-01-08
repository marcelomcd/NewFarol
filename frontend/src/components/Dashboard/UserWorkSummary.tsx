import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { workItemsApi } from '../../services/api'
import WorkItemsTable from './WorkItemsTable'

interface UserWorkSummaryProps {
  userName: string
}

export default function UserWorkSummary({ userName }: UserWorkSummaryProps) {
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'user', userName],
    queryFn: () => workItemsApi.getTasks({ assigned_to: userName }),
  })

  const { data: bugsData } = useQuery({
    queryKey: ['bugs', 'user', userName],
    queryFn: () => workItemsApi.getBugs({ assigned_to: userName }),
  })

  const { data: userStoriesData } = useQuery({
    queryKey: ['user-stories', 'user', userName],
    queryFn: () => workItemsApi.getUserStories({ assigned_to: userName }),
  })

  // Buscar todas as features e filtrar por usuário
  const { data: allFeaturesData } = useQuery({
    queryKey: ['features', 'overdue'],
    queryFn: () => workItemsApi.getOverdueFeatures(),
  })

  const tasks = tasksData?.tasks || []
  const bugs = bugsData?.bugs || []
  const userStories = userStoriesData?.user_stories || []
  const features = allFeaturesData?.features?.filter(f => f.assigned_to === userName) || []

  const totalWork = tasks.length + bugs.length + userStories.length + features.length

  if (totalWork === 0) {
    return null
  }

  const allWorkItems = [
    ...tasks.map(t => ({ ...t, work_item_type: 'Task' })),
    ...bugs.map(b => ({ ...b, work_item_type: 'Bug' })),
    ...userStories.map(us => ({ ...us, work_item_type: 'Story' })),
    ...features.map(f => ({ ...f, work_item_type: 'Feature' })),
  ].sort((a, b) => {
    // Ordenar por estado (Em Andamento primeiro, depois New, depois outros)
    const stateOrder: Record<string, number> = {
      'Em Andamento': 1,
      'Active': 2,
      'New': 3,
      'Em Planejamento': 4,
    }
    const aOrder = stateOrder[a.state] || 99
    const bOrder = stateOrder[b.state] || 99
    return aOrder - bOrder
  })

  return (
    <div className="glass dark:glass-dark p-6 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Work assigned to {userName} ({totalWork})
        </h3>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{tasks.length} Task{tasks.length !== 1 ? 's' : ''}</span>
          <span>{bugs.length} Bug{bugs.length !== 1 ? 's' : ''}</span>
          <span>{userStories.length} Story{userStories.length !== 1 ? 'ies' : ''}</span>
          <span>{features.length} Feature{features.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <WorkItemsTable
        title={`Work assigned to ${userName}`}
        items={allWorkItems}
        columns={[
          {
            key: 'id',
            label: 'ID',
          },
          {
            key: 'state',
            label: 'State',
            render: (item) => (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {item.state}
              </span>
            ),
          },
          {
            key: 'title',
            label: 'Title',
            render: (item) => (
              <div className="max-w-md truncate" title={item.title}>
                {item.title || 'Sem título'}
              </div>
            ),
          },
        ]}
        maxRows={15}
      />
    </div>
  )
}

