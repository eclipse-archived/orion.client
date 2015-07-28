**Orion Webtools** provides an AST processor for the [CSS parser](https://github.com/CSSLint/parser-lib) we use. This 
page is the offcial specification for that AST separated by AST node section with BNF-like JSON
examples.

# The AST

Once we started to provide some good content assist and other tooling, we realized that simply using the output or the just the 
token stream from CSSLint was not going to be enough, and had a negative impact on the performance of the tools themselves. To combat this, and make it easier for
us to ask hard questions about a style sheet, we needed an AST.

The following sections provide specifications and examples of the AST we produce.

### Parser Options

Aside from the default parser options provided by [CSSLint parser-lib](https://github.com/CSSLint/parser-lib) we provide additional options:
1. **ranges** - provides an start and end range for each node

### StyleSheet

This is the root node for the AST which contains a `body` array entry containing all other elements.

```json
"StyleSheet": {
    "body": [AtRule* | RuleSet*],
    "range": [Number, Number]
}
```

### AtRule

This element describes `@-prefixed` statments like `@import` and `@charset`. The full specification of AtRules can be found
on the [MDN CSS pages](https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule).

```json
"AtRule": {
    "name": String,
    "value": String | Function,
    "mediaqueries": [MediaQuery*]
    "range": [Number, Number]
}
```

### MediaQuery

These elements can appear in various places in CSS and are comprised of a [Media Type](#mediatype) and at least one expression. The full specification
for media queries can be found on the [MDN Media Query page](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries).

```json
"MediaQuery": {
    "operator": Operator | null,
    "value": MediaType | Expression,
    "range": [Number, Number]
}
```

### Operator 

This node is an operator used in [Media Queries](#mediaquery).

```json
"Operator": {
    "value": "not" | "only" | "and",
    "range": [Number, Number]
}
```

### MediaType

This is the kind of media the [Media Query](#mediaquery) is referring to.

```json
"MediaType": {
    "value": "all" | "aural" | "braille" | "handheld" | "print" | "projection" | "screen" | "tty" | "tv" | "embossed",
    "range": [Number, Number]
}
```

### Expression

This is part of a media query.

```json
"Expression": {
    "operator": Operator | null,
    "expression": {
        "feature": MediaFeature,
        "value": {
            "value": Object,
            "range": [Number, Number]
        }
    },
    "range": [Number, Number]
}
```

### MediaFeature

The feature part of a media query expression

```json
"MediaFeature": {
    "value": width" | "min-width" | "max-width" | "height" | "min-height" | "max-height" | "device-width" | "min-device-width" | "max-device-width"
             | "device-height" | "min-device-height" | "max-device-height" | "aspect-ratio" | "min-aspect-ratio" | "max-aspect-ratio" | "device-aspect-ratio" 
             | "min-device-aspect-ratio" | "max-device-aspect-ratio" | "color" | "min-color" | "max-color" | "color-index" | "min-color-index" | "max-color-index"
             | "monochrome" | "min-monochrome" | "max-monochrome" | "resolution" | "min-resolution" | "max-resolution" | "scan" | "grid",
    "range": [Number, Number]
}
```

### Rule

This is a descriptor that combines a [Selector](#selector), pseudo-classes and pseudo-elements to scope a particular set of rules.

```json
"Rule": {
    "selector": Selector | Combinator,
    "pseudoclass": Pseudo | null,
    "pseudoelement": Pseudo | null,
    "properties": [Property*]
}
```

### Pseudo

This is a pseudo-part of a selector, being one of a [pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) or a 
[pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/pseudo-elements)

```json
"Pseudo": {
    "name": {
        "value": "class" | "element",
        "range": [Number, Number]
    },
    "value": {
        "value: "::after" | "::before" | "::first-letter" | "::first-line" | "::selection" | ":active" | ":checked" | ":default" | ":dir()" | ":disabled"
            | ":empty" | ":enabled" | ":first" | ":first-child" | ":first-of-type" | ":fullscreen" | ":focus" | ":hover" | ":indeterminate" | ":in-range"
            | ":invalid" | ":lang()" | ":last-child" | ":last-of-type" | ":left" | ":link" | ":not()" | ":nth-child()" | ":nth-last-child()" | ":nth-last-of-type()"
            | ":nth-of-type()" | ":only-child" | ":only-of-type" | ":optional" | ":out-of-range" | ":read-only" | ":read-write" | ":required" | ":right"
            | ":root" | ":scope" | ":target" | ":valid" | ":visited" | "::backdrop",
        "range": [Number, Number]
    },
    "range": [Number, Number]
}
```

### Property

This is a `property:value` pairing in a [Rule](#rule)

```json
"Property": {
    "property": {
        "value": String
        "range": [Number, Number]
    },
    "value": {
        "value": MediaQuery* | Declaration* | String | Number
        "range": [Number, Number]
    }
    "range": [Number, Number]
}
```

### Selector

This node describes the portion of a rule set that is used to determine where the rule and declarations apply. For more information see 
the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Type_selectors).

```json
"Selector": {
    "value": {
        "value": String,
        "range": [Number, Number]
    },
    "kind": "type" | "class" | "id" | "universal" | "attribute",
    "range": [Number, Number]
}
```

### Combinator

This is a [Selector](#selector) node that is used in an expression like `h1:after + li`.

```json
    "left": Selector,
    "right": Selector,
    "operator": Operator
    "range": [Number, Number]
```