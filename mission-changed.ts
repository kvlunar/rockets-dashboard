import { on } from '@riddance/service/event'
import { updateRocket } from './lib/schema.js'

on('rocket', 'mission-changed', async (context, subject, event) => {
    const { meta, newMission } = event as {
        meta: { sequence: number; timestamp: string }
        newMission: string
    }

    await updateRocket(context, subject, {
        meta,
        type: 'mission-changed',
        mission: newMission,
    })
})
