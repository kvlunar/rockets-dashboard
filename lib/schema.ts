import { isConflict, isNotFound, tables } from '@riddance/docs'

export type RocketState = {
    id: string
    type: string
    currentSpeed: number
    mission: string
    status: 'active' | 'exploded'
    launchTime: Date
    explosionReason?: string
    processedMessageIds: string[]
}

type Schema = {
    Rockets: {
        state: {
            [rocketId: string]: RocketState
        }
    }
}

export function rockets(context: object) {
    return tables<Schema>(context).Rockets.state
}

export async function getRocketState(
    context: object,
    rocketId: string,
): Promise<RocketState | undefined> {
    try {
        return await rockets(context).getDocument(rocketId)
    } catch (e) {
        if (isNotFound(e)) {
            return undefined
        }
        throw e
    }
}

export async function getAllRockets(context: object): Promise<RocketState[]> {
    const allRockets: RocketState[] = []
    for await (const { document } of rockets(context).getAll()) {
        allRockets.push(document)
    }
    return allRockets
}

export async function deleteAllRockets(context: object) {
    const rs = rockets(context)
    for await (const { key, revision } of rs.getAll()) {
        await rs.delete(key, revision)
    }
}

export async function updateRocketState(
    context: object,
    rocketId: string,
    updatedState: RocketState,
): Promise<void> {
    const maxRetries = 3
    let retries = 0

    while (retries < maxRetries) {
        try {
            const existing = await rockets(context).get(rocketId)
            await rockets(context).updateRow({
                key: rocketId,
                revision: existing.revision,
                document: updatedState,
            })
            return
        } catch (e) {
            if (isNotFound(e)) {
                await rockets(context).add(rocketId, updatedState)
                return
            }
            if (isConflict(e) && retries < maxRetries - 1) {
                retries++
                continue
            }
            throw e
        }
    }
}
