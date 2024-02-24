import { Router } from "express";
import { paths } from "../schema";
import { serializePlanet } from "../serializers";
import getOrNotFound from "../utils/getOrNotFound";
import System from "../models/static-game-data/System";
import Planet from "../models/static-game-data/Planet";

export default function addSystemsPlanetsRoutes(router: Router) {
    router.get<
        paths["/systems/{systemId}/planets"]["get"]["parameters"]["path"],
        paths["/systems/{systemId}/planets"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/systems/:systemId/planets", async (req, res) => {
        const system = await getOrNotFound<System>(
            System,
            req.params["systemId"],
            res,
        );

        const planets = await Planet.findAll({
            where: {
                systemId: system.id,
            },
            order: ["order"],
        });

        res.json({
            items: planets.map((planet) => serializePlanet(planet)),
        });
    });
}
