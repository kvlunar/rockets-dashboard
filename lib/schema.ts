import { isConflict, isNotFound, tables } from '@riddance/docs'

type RocketState = {
    future?: Event[]
} & (object | LaunchedRocketState)

type LaunchedRocketState = {
    sequence: number
    rocketType: string
    launchTime: string
    current: {
        speed: number
        mission: string
    }
    explosionReason?: string
}

type Event = {
    meta: {
        timestamp: string
        sequence: number
    }
} & (
    | {
          type: 'launched'
          rocketType: string
          launchSpeed: number
          mission: string
      }
    | {
          type: 'mission-changed'
          mission: string
      }
    | {
          type: 'speed-changed'
          delta: number
      }
    | {
          type: 'exploded'
          reason: string
      }
)

export async function updateRocket(context: object, id: string, event: Event) {
    const rs = rockets(context)
    await retryConflict(async () => {
        try {
            const state = await rs.get(id)
            if ('sequence' in state.document) {
                const nextInSequence = event.meta.sequence === state.document.sequence + 1
                if (nextInSequence) {
                    applyEvent(state.document, event)
                    catchUpToFuture(state.document)
                } else {
                    appendFutureEvent(state.document, event)
                }
            } else {
                if (event.meta.sequence === 0) {
                    if (event.type !== 'launched') {
                        throw new Error('Unexpected first event.')
                    }
                    state.document = {
                        ...state.document,
                        sequence: 0,
                        rocketType: event.rocketType,
                        launchTime: event.meta.timestamp,
                        current: {
                            speed: event.launchSpeed,
                            mission: event.mission,
                        },
                    }
                    catchUpToFuture(state.document)
                } else {
                    appendFutureEvent(state.document, event)
                }
            }
            await rs.updateRow(state)
        } catch (e) {
            if (isNotFound(e)) {
                if (event.meta.sequence !== 0) {
                    await rs.add(id, { future: [event] })
                    return
                }
                if (event.type !== 'launched') {
                    throw new Error('Unexpected first event.')
                }
                await rs.add(id, {
                    sequence: 0,
                    rocketType: event.rocketType,
                    launchTime: event.meta.timestamp,
                    current: {
                        speed: event.launchSpeed,
                        mission: event.mission,
                    },
                })
                return
            }
            throw e
        }
    })
}

function applyEvent(state: LaunchedRocketState, event: Event) {
    if (event.type === 'launched') {
        throw new Error('Rocket reuse not supported.')
    }
    state.sequence = event.meta.sequence
    if (state.explosionReason) {
        return
    }
    switch (event.type) {
        case 'speed-changed':
            state.current.speed = Math.max(state.current.speed + event.delta, 0)
            break
        case 'mission-changed':
            state.current.mission = event.mission
            break
        case 'exploded':
            state.explosionReason = event.reason
            break
    }
}

function appendFutureEvent(state: RocketState, event: Event) {
    if (!state.future) {
        state.future = [event]
        return
    }
    const duplicate = state.future.find(e => e.meta.sequence === event.meta.sequence)
    if (duplicate) {
        return
    }
    state.future.push(event)
}

function catchUpToFuture(state: RocketState & LaunchedRocketState) {
    if (!state.future) {
        return
    }
    for (;;) {
        const nextEvent = state.future.find(e => e.meta.sequence === state.sequence + 1)
        if (!nextEvent) {
            state.future = state.future.filter(e => state.sequence < e.meta.sequence)
            if (state.future.length === 0) {
                delete state.future
            }
            break
        }
        applyEvent(state, nextEvent)
    }
}

type Schema = {
    Rockets: {
        state: {
            [rocketId: string]: RocketState
        }
    }
}

function rockets(context: object) {
    return tables<Schema>(context).Rockets.state
}

export async function getRocketState(context: object, rocketId: string) {
    try {
        return rocketFromState(rocketId, await rockets(context).getDocument(rocketId))
    } catch (e) {
        if (isNotFound(e)) {
            return undefined
        }
        throw e
    }
}

export async function getAllRockets(context: object) {
    const allRockets = []
    for await (const { key, document } of rockets(context).getAll()) {
        allRockets.push(rocketFromState(key, document))
    }
    return allRockets.filter(r => !!r)
}

function rocketFromState(key: string, document: RocketState) {
    if (!('sequence' in document)) {
        return undefined
    }
    return {
        id: key,
        rocketType: document.rocketType,
        launchTime: new Date(document.launchTime),
        currentSpeed: document.current.speed,
        mission: document.current.mission,
        status: document.explosionReason ? 'exploded' : 'active',
        explosionReason: document.explosionReason,
    }
}

export async function deleteAllRockets(context: object) {
    const rs = rockets(context)
    for await (const { key, revision } of rs.getAll()) {
        await rs.delete(key, revision)
    }
}

async function retryConflict<T>(fn: () => Promise<T>) {
    const maxRetries = 3
    for (let retries = 0; ; ++retries) {
        try {
            return await fn()
        } catch (e) {
            if (isConflict(e) && retries < maxRetries) {
                continue
            }
            throw e
        }
    }
}
