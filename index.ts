import './Tokenizer';

type NumberTerm = { tag: 'number'; value: number };

type Term =
  | NumberTerm
  | { tag: 'binaryFunction'; fn: (a: number, b: number) => number }
  | { tag: 'unaryFunction'; fn: (a: number) => number };

const TermHelpers = {
  NumberTerm(value: number): Term {
    return { tag: 'number', value };
  },
  BinaryOperator(fn: (a: number, b: number) => number): Term {
    return { tag: 'binaryFunction', fn };
  },
  GetNumber(term: Term): number {
    if (term.tag !== 'number') {
      throw new Error('Should have been a number but found: ' + term.tag);
    }
    return term.value;
  },
  IsNumber(term: Term): term is NumberTerm {
    return term.tag === 'number';
  },
  AssertNumber(term: Term): asserts term is NumberTerm {
    if (term.tag !== 'number') {
      throw new Error('Should have been a number but found: ' + term.tag);
    }
  },
};


type Expression = Term[];

function evaluateExpression(expression: Expression): Term {
  const stack: Term[] = [];

  for (const term of expression) {
    if (term.tag === 'number') {
      stack.push(term);
    } else if (term.tag === 'binaryFunction') {
      const b = stack.pop();
      const a = stack.pop();
      const result = term.fn(
        TermHelpers.GetNumber(a),
        TermHelpers.GetNumber(b)
      );
      stack.push(TermHelpers.NumberTerm(result));
    }
  }

  if (stack.length !== 1) {
    throw new Error('Stack was: ' + JSON.stringify(stack));
  }

  return stack[stack.length - 1];
}

/*
  The Shunting Yard Algorithm
  * when popping from op stack, drop commas (and commas super low-prec)

  * If number: push on normal stack
  * If operator:
    while top of op stack is op with higher precedence
      pop op stack to norm stack
    push on operator stack
  * If left parenthesis: push on operator stack
  * If right parenthesis: pops from op stack to norm stack until '('
  * When input empty pop from op stack to norm stack until empty
  * Op stack (bottom to top) is result
*/

/*
const Operators = {
  '+': {
    run : (a, b) => a + b,
    precedence: 0,
  }
}*/

function tokenToTerm(token: string): Term {
  if (token === '+') {
    return TermHelpers.BinaryOperator((a, b) => a + b);
  } else if (token === '-') {
    return TermHelpers.BinaryOperator((a, b) => a - b);
  } else if (token === '*') {
    return TermHelpers.BinaryOperator((a, b) => a * b);
  } else if (token === '/') {
    return TermHelpers.BinaryOperator((a, b) => a / b);
  } else if (token === '%') {
    return TermHelpers.BinaryOperator((a, b) => a % b);
  } else {
    return TermHelpers.NumberTerm(Number(token));
  }
}

function parseTokens(terms: string[]): Term[] {
  // TODO - shunting yard algorithm
  return [];
}

const resultTerm = evaluateExpression(
  ['4', '2', '+', '3', '*'].map((t) => tokenToTerm(t))
  //parseTokens(['(', '4', '+', '2', ')', '*', '3'])
);

//console.log(TermHelpers.GetNumber(resultTerm));

function tokenize(buffer: string): string[] {
  return [];
}

function evaluate(contents: string): number {
  const result = evaluateExpression(parseTokens(tokenize(contents)));
  return TermHelpers.GetNumber(result);
}
