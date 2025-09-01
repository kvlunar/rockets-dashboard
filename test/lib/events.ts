import { randomUUID } from 'node:crypto'

export function createRocketId(): string {
    return randomUUID()
}

export function createLaunchedEvent(type = 'Falcon-9', launchSpeed = 1000, mission = 'ARTEMIS') {
    return {
        type,
        launchSpeed,
        mission,
    }
}

export function createSpeedIncreasedEvent(by = 100) {
    return { by }
}

export function createSpeedDecreasedEvent(by = 100) {
    return { by }
}

export function createExplodedEvent(reason = 'PRESSURE_VESSEL_FAILURE') {
    return { reason }
}

export function createMissionChangedEvent(newMission = 'SHUTTLE_MIR') {
    return { newMission }
}
