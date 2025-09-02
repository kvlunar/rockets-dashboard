import { randomUUID } from 'node:crypto'

export function createRocketId(): string {
    return randomUUID()
}

export function createLaunchedEvent(
    type = 'Falcon-9',
    launchSpeed = 1000,
    mission = 'ARTEMIS',
    sequence = 0,
    timestamp = new Date(),
) {
    return {
        meta: { timestamp, sequence },
        type,
        launchSpeed,
        mission,
    }
}

export function createSpeedIncreasedEvent(by = 100, sequence: number, timestamp = new Date()) {
    return {
        meta: { timestamp, sequence },
        by,
    }
}

export function createSpeedDecreasedEvent(by = 100, sequence: number, timestamp = new Date()) {
    return {
        meta: { timestamp, sequence },
        by,
    }
}

export function createExplodedEvent(
    reason = 'PRESSURE_VESSEL_FAILURE',
    sequence: number,
    timestamp = new Date(),
) {
    return {
        meta: { timestamp, sequence },
        reason,
    }
}

export function createMissionChangedEvent(
    newMission = 'SHUTTLE_MIR',
    sequence: number,
    timestamp = new Date(),
) {
    return {
        meta: { timestamp, sequence },
        newMission,
    }
}
