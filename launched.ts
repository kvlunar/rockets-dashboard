import { on } from '@riddance/service/event'
import { updateRocket } from './lib/schema.js'

on('rocket', 'launched', async (context, subject, event) => {
    const { meta, type, launchSpeed, mission } = event as {
        meta: { sequence: number; timestamp: string }
        type: string
        launchSpeed: number
        mission: string
    }

    await updateRocket(context, subject, {
        meta,
        type: 'launched',
        rocketType: type,
        launchSpeed,
        mission,
    })
})
