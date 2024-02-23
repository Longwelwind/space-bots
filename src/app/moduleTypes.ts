import { Router } from "express";
import ModuleType from "../models/static-game-data/ModuleType";
import ModuleTypeRefineryBlueprintOutputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeLevel from "../models/static-game-data/ModuleTypeLevel";
import { paths } from "../schema";
import { serializeModuleType } from "../serializers";

export default function addModuleTypesRoutes(router: Router) {
    router.get<
        null,
        paths["/module-types"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/module-types", async (req, res) => {
        const moduleTypes = await ModuleType.findAll({
            include: [
                ModuleTypeLevel,
                {
                    model: ModuleTypeRefineryBlueprint,
                    include: [
                        ModuleTypeRefineryBlueprintInputResource,
                        ModuleTypeRefineryBlueprintOutputResource,
                    ],
                },
            ],
        });

        res.json({
            items: moduleTypes.map((moduleType) =>
                serializeModuleType(moduleType),
            ),
        });
    });
}
