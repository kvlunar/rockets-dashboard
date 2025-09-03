import { on } from '@riddance/service/event'
import { updateRocket } from './lib/schema.js'

on('rocket', 'speed-decreased', async (context, subject, event) => {
    const { meta, by } = event as { meta: { sequence: number; timestamp: string }; by: number }

    await updateRocket(context, subject, {
        meta,
        type: 'speed-changed',
        delta: -by,
    })
})
