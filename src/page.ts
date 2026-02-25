import type { JSONSchema7, JSONSchema7Definition } from "json-schema";
import "./page.css";

type APIInfo = {
    components: {
        schemas: Record<string, JSONSchema7>;
    };
};

async function getAPIJson(): Promise<APIInfo | null> {
    try {
        return fetch(
            "https://raw.githubusercontent.com/the-blue-alliance/the-blue-alliance/refs/heads/main/src/backend/web/static/swagger/api_v3.json"
        )
            .then((r) => r.json())
            .catch((e) => null);
    } catch {
        return null;
    }
}

const root = document.getElementById("root");
if (!root) throw new Error("root not found");
const status = document.createElement("div");
root.append(status);

const api = await getAPIJson();
console.log(api);
if (!api) {
    status.textContent = "failed to fetch api schema";
    throw new Error("failed to fetch api schema");
}

type TypeEntry = {
    name: string;
    required: boolean;
} & (
    | {
          type: string;
          properties?: never;
          array?: never;
      }
    | {
          properties: TypeEntry[];
          array?: never;
          type?: never;
      }
    | {
          array: Pick<TypeEntry, Exclude<keyof TypeEntry, "name" | "required">>;
          type?: never;
          properties?: never;
      }
);

const exampleType: TypeEntry = {
    name: "Console",
    required: true,
    properties: [
        {
            name: "log",
            required: true,
            type: "()=>void"
        },
        {
            name: "time",
            required: false,
            type: "number"
        },
        {
            name: "history",
            required: true,
            array: {
                type: "HistoryEntry"
            }
        }
    ]
};

function getPath(path: string, obj: any = schemaRoot) {
    const cutPath = schemaRootPath.slice(2);
    if (path.startsWith("#")) path = path.substring(1);
    if (path.startsWith("/")) path = path.substring(1);
    if (path.startsWith(cutPath)) path = path.substring(cutPath.length);
    const parts = path.split("/");
    function recurse(parts: string[], obj: any) {
        if (parts.length > 0 && obj !== null && obj !== undefined) {
            if (parts[0] in obj) {
                return recurse(parts.slice(1), obj[parts[0]]);
            }
            return undefined;
        }
        return obj;
    }
    return recurse(parts, obj);
}

const schemaRootPath = "#/components/schemas/";
const schemaRoot = api.components.schemas;
const types: TypeEntry[] = [];

function renderString(name: string, required: boolean, data: JSONSchema7 & { type: "string" }): TypeEntry {
    if (data.enum) {
        const enumValues = `"${data.enum.join(`"|"`)}"`;
        return {
            name,
            required,
            type: enumValues
        };
    }
    return {
        name,
        required,
        type: "string"
    };
}

function schematoTypeDef([typeName, typeDef]: [string, JSONSchema7Definition]) {
    if (typeof typeDef !== "boolean" && typeDef.type == "object") {
        const properties: TypeEntry[] = [];
        Object.entries(typeDef.properties ?? {}).forEach(([name, def]) => {
            properties.push({
                name,
                required: (typeDef.required ?? []).includes(name),
                type: schematoTypeDef([name, def])
            });
        });
    }
    return "";
}

Object.entries(schemaRoot).forEach(schematoTypeDef);
