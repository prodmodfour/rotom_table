# Form Template Method

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When subclasses implement algorithms with the same steps in the same order but with different details, move the algorithm skeleton to the parent class and let subclasses override individual steps.

The parent defines *what* happens and in *what order*; subclasses define *how* each step works.
