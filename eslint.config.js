import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default [
    {
        ignores: ["node_modules/", ".agents/", ".git/"],
    },
    eslintPluginPrettier,
];
