export function render({
    name,
    obj,
    topLevel = false,
    raw = false
}: {
    name: string;
    obj: any;
    topLevel?: boolean;
    raw?: boolean;
}) {
    const comment = raw ? "" : obj.description ? `/** ${obj.description} */\n` : "";
    let base = raw ? "" : comment + (topLevel ? "export type " + name + " = " : name + ": ");
    if ("oneOf" in obj) {
        const opts = obj.oneOf.map((e: any) =>
            render({
                name: "",
                obj: e,
                raw: true
            })
        );
        base += opts.join("|");
    } else if ("$ref" in obj) {
        const type: string = obj.$ref.split("/").pop();
        base += type;
        const types = obj.type;
        if (Array.isArray(types)) {
            const nonObject = types.filter((e) => e !== "object");
            delete obj.$ref;
            const other = nonObject
                .map((e) => {
                    const result = render({
                        name: "",
                        obj: { ...obj, type: e },
                        topLevel: false,
                        raw: true
                    });
                    if (true) {
                        // console.log(
                        //     "recurse",
                        //     {
                        //         name: "",
                        //         obj: { ...obj, type: e },
                        //         topLevel: false,
                        //         raw: true
                        //     },
                        //     result
                        // );
                    }
                    return result;
                })
                .join("|");
            base += "|" + other;
        }
    } else if (obj.type === "string") {
        const enums = obj.enum;
        if (enums) {
            base += `"${enums.join(`" | "`)}"`;
        } else {
            base += "string";
        }
    } else if (obj.type === "null") {
        base += "null";
    } else if (obj.type === "boolean") {
        base += "boolean";
    } else if (obj.type === "integer" || obj.type === "number") {
        base += "number";
    } else if (obj.type === "object") {
        const isRecord =
            "additionalProperties" in obj &&
            typeof obj.additionalProperties !== "boolean" &&
            JSON.stringify(obj.additionalProperties).length > 2; // ensure at least 1 property exists
        const isNormal = "properties" in obj && JSON.stringify(obj.properties).length > 2; // ensure at least 1 property exists
        if (isRecord && isNormal) {
            console.warn("object is not standard", obj);
        } else if (isRecord) {
            base += "Record<string, ";
            base += render({
                name: "",
                obj: obj.additionalProperties,
                raw: true
            });
            base += ">";
        } else if (isNormal) {
            base += "{\n";
            const props = obj.properties;
            const required = Array.isArray(obj.required) ? obj.required : [];
            if (props) {
                base += Object.entries<any>(props)
                    .map(([key, val]) =>
                        render({
                            name:
                                key + (required.includes(key) || val.required === true ? "" : "?"),
                            obj: val
                        })
                    )
                    .join("\n");
            }
            base += "\n}";
        } else {
            // console.error("object not in valid format", obj);
            base += "any";
        }
    } else if (obj.type === "array") {
        const items = render({
            name: "",
            obj: obj.items,
            raw: true
        });
        base += `(${items})[]`;
    } else if (Array.isArray(obj.type)) {
        const types = obj.type.map((e: any) =>
            render({
                name: "",
                obj: {
                    ...obj,
                    items: obj.items,
                    type: e
                },
                raw: true
            })
        );
        base += types.join("|");
    }
    if (!raw) {
        base += ";";
    }
    return base;
}
