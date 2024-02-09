import { Router } from "express";
import {
    ModuleType,
    ModuleTypeLevel,
    ModuleTypeRefineryBlueprint,
    ModuleTypeRefineryBlueprintInputResource,
    ModuleTypeRefineryBlueprintOutputResource,
} from "../database";
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
