import { Router } from "express";
import Resource from "../models/static-game-data/Resource";
import { paths } from "../schema";
import { serializeResource } from "../serializers";

export default function addResourcesRoutes(router: Router) {
    router.get<
        null,
        paths["/resources"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/resources", async (req, res) => {
        const resources = await Resource.findAll();

        res.json(resources.map((resource) => serializeResource(resource)));
    });
}
