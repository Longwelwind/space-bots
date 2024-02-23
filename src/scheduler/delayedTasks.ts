import _ from "lodash";
import { v4 } from "uuid";

import { traceIdStore } from "../utils/logger";
import Fleet from "../models/Fleet";
import ModuleRefineryJob from "../models/ModuleRefineryJob";
import scheduleFleetArrival from "./scheduleFleetArrival";
import scheduleMiningFinish from "./scheduleMiningFinish";
import scheduleModuleJobFinish from "./scheduleModuleJobFinish";

export const scheduledTaskTimeouts: NodeJS.Timeout[] = [];

export function scheduleDelayedTask(executionTime: Date, task: () => void) {
    const delay = Math.max(0, executionTime.getTime() - Date.now());

    const taskTimeout = setTimeout(() => {
        _.pull(scheduledTaskTimeouts, taskTimeout);

        traceIdStore.run(v4(), task);
    }, delay);

    scheduledTaskTimeouts.push(taskTimeout);
}

export function unscheduleAllDelayedTasks() {
    scheduledTaskTimeouts.map((taskTimeout) => clearTimeout(taskTimeout));
}

export async function launchDelayedTasks() {
    // Launch all delayed events:
    // Traveling fleets
    const travelingFleets = await Fleet.findAll({
        where: { currentAction: "traveling" },
    });

    travelingFleets.forEach((fleet) => {
        scheduleFleetArrival(fleet.id, fleet.arrivalTime);
    });

    // Mining fleets
    const miningFleets = await Fleet.findAll({
        where: { currentAction: "mining" },
    });

    miningFleets.forEach((fleet) => {
        scheduleMiningFinish(fleet.id, fleet.miningFinishTime);
    });

    // Refinery modules jobs
    const refineryJobs = await ModuleRefineryJob.findAll();

    refineryJobs.forEach((refineryJob) => {
        scheduleModuleJobFinish(refineryJob.id, refineryJob.finishTime);
    });
}
