import { Router } from "express";
import { ShipType } from "../database";
import { paths } from "../schema";
import { serializeShipTypes } from "../serializers";

export default function addShipTypesRoutes(router: Router) {
    router.get<
        null,
        paths["/ship-types"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/ship-types", async (req, res) => {
        const shipTypes = await ShipType.findAll();

        res.json(shipTypes.map((shipType) => serializeShipTypes(shipType)));
    });
}
