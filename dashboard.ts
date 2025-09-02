import { get } from '@riddance/service/http'
import { getAllRockets } from './lib/schema.js'

get('', async context => {
    const rockets = await getAllRockets(context)

    return {
        body: rockets
            .map(rocket => ({
                id: rocket.id,
                type: rocket.rocketType,
                currentSpeed: rocket.currentSpeed,
                mission: rocket.mission,
                status: rocket.status,
                launchTime: rocket.launchTime,
                ...(rocket.explosionReason && { explosionReason: rocket.explosionReason }),
            }))
            .sort((a, b) => new Date(a.launchTime).getTime() - new Date(b.launchTime).getTime()),
    }
})
