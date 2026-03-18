# Long Method

A [[bloater-smells|bloater]] [[code-smells|smell]]. A method that contains too many lines of code. Any method longer than ten lines should raise questions.

Long methods are the most common bloater. Mentally, it's easier to create new code within an existing method than to create a new method for it — so methods grow. The longer a method gets, the harder it becomes to understand, maintain, and test.

## See also

- [[composing-methods-techniques]] — the techniques that address long methods, especially [[extract-method]]
- [[large-class-smell]] — often appears alongside long methods, since classes with too many responsibilities accumulate them
- [[next-turn-route-business-logic]] — 846 lines in a single route handler
- [[transaction-script-turn-lifecycle]] — the turn lifecycle as a textbook transaction script long method
