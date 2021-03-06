
function hljsDefineGraphQL(hljs) {
  return {
    aliases: ["gql"],
    keywords: {
      keyword: "query mutation subscription|10 type input schema directive interface union scalar fragment|10 enum on ...",
      literal: "true false null"
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE,
      {
        className: "type",
        begin: "[A-Z][a-z]",
        end: "\\W",
        excludeEnd: !0,
      },
      {
        className: "literal",
        begin: "[A-Z][A-Z]",
        end: "\\W",
        excludeEnd: !0,
      },
      {
        className: "variable",
        begin: "\\$",
        end: "\\W",
        excludeEnd: !0,
      },
      {
        className: "keyword",
        begin: "[.]{2}",
        end: "\\.",
      },
      {
        className: "meta",
        begin: "@",
        end: "\\W",
        excludeEnd: !0,
      },
    ],
    illegal: /([;<']|BEGIN)/,
  };
}
