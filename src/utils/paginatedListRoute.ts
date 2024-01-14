import { Request, Response } from "express";
import HttpError from "./HttpError";
import {
    Attributes,
    FindAttributeOptions,
    GroupOption,
    Includeable,
    Model,
    ModelStatic,
    Op,
    Sequelize,
    WhereOptions,
} from "sequelize";
import _ from "lodash";

export default async function paginatedListRoute<E extends Model>(
    req: Request<
        any,
        any,
        any,
        { count?: number; pagePrevious?: string; pageNext?: string }
    >,
    res: Response,
    modelToList: ModelStatic<E>,
    sortingKeys: { colName: string; ascending: boolean }[],
    serializer: (e: E) => any,
    whereConditions: WhereOptions<Attributes<E>> = {},
    includes: Includeable | Includeable[] = [],
    attributes: FindAttributeOptions = null,
    group: string = null,
) {
    const count = req.query["count"] || 20;
    const pagePrevious = req.query["pagePrevious"]?.split(",");
    const pageNext = req.query["pageNext"]?.split(",");

    if (pageNext != null && pagePrevious != null) {
        throw new HttpError(
            400,
            "both_cursor_not_allowed",
            "You must provide neither or either cursorBefore or cursorAfter, but not both at the same time",
        );
    }
    const isGoingForward = pagePrevious == null;

    const whereConditionsForPaginations: WhereOptions<Attributes<E>> = {
        ...(isGoingForward && pageNext != null
            ? Object.assign(
                  {},
                  ...sortingKeys.map(({ colName, ascending }, i) => ({
                      [colName]: { [ascending ? Op.gt : Op.lt]: pageNext[i] },
                  })),
              )
            : {}),
        ...(!isGoingForward
            ? Object.assign(
                  {},
                  ...sortingKeys.map(({ colName, ascending }, i) => ({
                      [colName]: {
                          [ascending ? Op.lt : Op.gt]: pagePrevious[i],
                      },
                  })),
              )
            : {}),
    };

    const rows = await modelToList.findAll({
        where: {
            ...whereConditions,
            ...whereConditionsForPaginations,
        },
        order: [
            // @ts-expect-error Again...
            sortingKeys.map(({ colName, ascending }) => [
                colName,
                ...((isGoingForward && ascending) ||
                (!isGoingForward && !ascending)
                    ? []
                    : ["DESC"]),
            ]),
        ],
        limit: count,
        include: includes,
        ...(group != null ? { group } : {}),
        ...(attributes != null ? { attributes } : {}),
    });

    const totalLeft = await modelToList.count({
        where: {
            ...whereConditions,
            ...whereConditionsForPaginations,
        },
        ...(group != null
            ? {
                  col: group,
                  distinct: true,
              }
            : {}),
    });

    const total = await modelToList.count({
        where: {
            ...whereConditions,
        },
        ...(group != null
            ? {
                  col: group,
                  distinct: true,
              }
            : {}),
    });

    // To keep `rows` in
    if (!isGoingForward) {
        rows.reverse();
    }

    const potentialPageNext =
        rows.length > 0
            ? sortingKeys
                  .map(({ colName }) => rows[rows.length - 1][colName])
                  .join(",")
            : null;
    const potentialPagePrevious =
        rows.length > 0
            ? sortingKeys.map(({ colName }) => rows[0][colName]).join(",")
            : 0;

    res.send({
        items: rows.map((item) => serializer(item)),
        pagination: {
            total,
            ...(isGoingForward
                ? totalLeft - rows.length > 0
                    ? { pageNext: potentialPageNext }
                    : {}
                : {}),
            ...(isGoingForward
                ? total - totalLeft > 0
                    ? { pagePrevious: potentialPagePrevious }
                    : {}
                : {}),
            ...(!isGoingForward
                ? totalLeft - rows.length > 0
                    ? { pagePrevious: potentialPagePrevious }
                    : {}
                : {}),
            ...(!isGoingForward
                ? total - totalLeft > 0
                    ? { pageNext: potentialPageNext }
                    : {}
                : {}),
        },
    });
}
