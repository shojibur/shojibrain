import { z } from "zod";
export declare const projectMapSchema: z.ZodObject<{
    schemaVersion: z.ZodNumber;
    generatedAt: z.ZodString;
    name: z.ZodString;
    languages: z.ZodArray<z.ZodString>;
    frameworks: z.ZodArray<z.ZodString>;
    packageManager: z.ZodNullable<z.ZodString>;
    sourceDirectories: z.ZodArray<z.ZodString>;
    testDirectories: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const fileEntrySchema: z.ZodObject<{
    language: z.ZodString;
    module: z.ZodNullable<z.ZodString>;
    imports: z.ZodArray<z.ZodString>;
    exports: z.ZodArray<z.ZodString>;
    isTest: z.ZodBoolean;
    size: z.ZodNumber;
}, z.core.$strip>;
export declare const moduleEntrySchema: z.ZodObject<{
    files: z.ZodArray<z.ZodString>;
    tests: z.ZodArray<z.ZodString>;
    confidence: z.ZodEnum<{
        high: "high";
        low: "low";
        medium: "medium";
    }>;
}, z.core.$strip>;
export declare const symbolEntrySchema: z.ZodObject<{
    type: z.ZodEnum<{
        class: "class";
        const: "const";
        function: "function";
        interface: "interface";
        method: "method";
        type: "type";
    }>;
    file: z.ZodString;
    exported: z.ZodBoolean;
}, z.core.$strip>;
export declare const dependencyEntrySchema: z.ZodObject<{
    dependsOn: z.ZodArray<z.ZodString>;
    usedBy: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const testsMapSchema: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
export declare const scanResultSchema: z.ZodObject<{
    project: z.ZodObject<{
        schemaVersion: z.ZodNumber;
        generatedAt: z.ZodString;
        name: z.ZodString;
        languages: z.ZodArray<z.ZodString>;
        frameworks: z.ZodArray<z.ZodString>;
        packageManager: z.ZodNullable<z.ZodString>;
        sourceDirectories: z.ZodArray<z.ZodString>;
        testDirectories: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    files: z.ZodRecord<z.ZodString, z.ZodObject<{
        language: z.ZodString;
        module: z.ZodNullable<z.ZodString>;
        imports: z.ZodArray<z.ZodString>;
        exports: z.ZodArray<z.ZodString>;
        isTest: z.ZodBoolean;
        size: z.ZodNumber;
    }, z.core.$strip>>;
    modules: z.ZodRecord<z.ZodString, z.ZodObject<{
        files: z.ZodArray<z.ZodString>;
        tests: z.ZodArray<z.ZodString>;
        confidence: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
    }, z.core.$strip>>;
    symbols: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<{
            class: "class";
            const: "const";
            function: "function";
            interface: "interface";
            method: "method";
            type: "type";
        }>;
        file: z.ZodString;
        exported: z.ZodBoolean;
    }, z.core.$strip>>;
    dependencies: z.ZodRecord<z.ZodString, z.ZodObject<{
        dependsOn: z.ZodArray<z.ZodString>;
        usedBy: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    tests: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map