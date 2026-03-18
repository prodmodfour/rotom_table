# Long Parameter List

A [[bloater-smells|bloater]] [[code-smells|smell]]. A method that requires more than three or four parameters. Long parameter lists are hard to understand, difficult to call correctly, and brittle — any reordering or addition breaks callers.

Often caused by merging several algorithms into a single method, or by trying to make a method too flexible. Passing an object instead of individual fields can reduce parameter count and clarify intent.

## See also

- [[introduce-parameter-object]] — bundle repeated parameter groups into an object
- [[preserve-whole-object]] — pass an object instead of extracting its fields
- [[data-clumps-smell]] — when several parameters frequently appear together, they may be a data clump that should become its own object
