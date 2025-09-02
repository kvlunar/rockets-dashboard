import { on } from '@riddance/service/event'
import { getRocketState, updateRocketState } from './lib/schema.js'

on('rocket', 'mission-changed', async (context, subject, event) => {
    const { meta, newMission } = event as { meta: { sequence: number }; newMission: string }

    const rocket = await getRocketState(context, subject)

    if (!rocket) {
        return
    }

    if (rocket.processedMessageIds.includes(meta.sequence)) {
        return
    }

    if (rocket.status === 'exploded') {
        return
    }

    rocket.processedMessageIds.push(meta.sequence)
    rocket.mission = newMission

    await updateRocketState(context, subject, rocket)
})
