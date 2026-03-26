# Incomplete Library Class

A [[coupler-smells|coupler]] [[code-smells|smell]]. An external library that doesn't provide enough functionality for your needs. Since you can't modify the library directly, workarounds accumulate in your own code — wrapper methods, utility helpers, monkey patches — creating coupling to the library's limitations.

The fix is usually to [[introduce-local-extension]] (wrapper or adapter) that provides the missing functionality in one place, or [[introduce-foreign-method]] for a single missing method.
