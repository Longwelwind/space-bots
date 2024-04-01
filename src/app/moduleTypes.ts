import { Router } from "express";
import ModuleType from "../models/static-game-data/ModuleType";
import ModuleTypeRefineryBlueprintOutputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintOutputResource";
import ModuleTypeRefineryBlueprintInputResource from "../models/static-game-data/ModuleTypeRefineryBlueprintInputResource";
import ModuleTypeRefineryBlueprint from "../models/static-game-data/ModuleTypeRefineryBlueprint";
import ModuleTypeLevel from "../models/static-game-data/ModuleTypeLevel";
import { paths } from "../schema";
import { serializeModuleType } from "../serializers";
import ModuleTypeShipyardBlueprint from "../models/static-game-data/ModuleTypeShipyardBlueprint";
import ModuleTypeShipyardBlueprintInputResource from "../models/static-game-data/ModuleTypeShipyardBlueprintInputResource";
import ModuleTypeLevelResource from "../models/static-game-data/ModuleTypeLevelResource";

export default function addModuleTypesRoutes(router: Router) {
    router.get<
        null,
        paths["/module-types"]["get"]["responses"][200]["content"]["application/json"],
        null
    >("/module-types", async (req, res) => {
        try {
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
                    {
                        model: ModuleTypeShipyardBlueprint,
                        include: [ModuleTypeShipyardBlueprintInputResource],
                    },
                ],
            });

            const moduleTypeLevelResources =
                await ModuleTypeLevelResource.findAll();

            const resourcesMap: Map<
                ModuleType,
                Map<ModuleTypeLevel, ModuleTypeLevelResource[]>
            > = new Map(
                moduleTypes.map(
                    (mt) =>
                        [
                            mt,
                            new Map(
                                mt.levels.map(
                                    (mtl) =>
                                        [
                                            mtl,
                                            moduleTypeLevelResources.filter(
                                                (mtlr) =>
                                                    mtlr.moduleTypeId ==
                                                        mt.id &&
                                                    mtlr.level == mtl.level,
                                            ),
                                        ] as [
                                            ModuleTypeLevel,
                                            ModuleTypeLevelResource[],
                                        ],
                                ),
                            ),
                        ] as [
                            ModuleType,
                            Map<ModuleTypeLevel, ModuleTypeLevelResource[]>,
                        ],
                ),
            );

            res.json({
                // @ts-expect-error I have no idea what is happening
                items: moduleTypes.map((moduleType) =>
                    serializeModuleType(
                        moduleType,
                        resourcesMap.get(moduleType),
                    ),
                ),
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });
}
