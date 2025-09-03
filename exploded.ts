import { on } from '@riddance/service/event'
import { updateRocket } from './lib/schema.js'

on('rocket', 'exploded', async (context, subject, event) => {
    const { meta, reason } = event as {
        meta: { sequence: number; timestamp: string }
        reason: string
    }

    await updateRocket(context, subject, {
        meta,
        type: 'exploded',
        reason,
    })
})
