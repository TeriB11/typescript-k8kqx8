// Tokenizer (also called a Lexer)
// Grammar - the specification of
//           valid arrangements of terms

class TextBuffer {
  public offset: number = 0;
  constructor(private readonly contents: string) {}

  get(count: number = 1): string | undefined {
    const idx = this.offset;
    if (this.offset + count < this.contents.length) {
      this.offset += count;
    }
    return this.contents.slice(idx, idx + count);
  }

  unget(count: number = 1) {
    if (this.offset - count >= 0) {
      this.offset -= count;
    }
  }

  runGet<T>(count: number, fn: (s: string) => ParseResult<T>): ParseResult<T> {
    const str = this.get(count)
    if (str) {
      const res = fn(str)
      if (res.data.tag === 'error') {
        this.unget(count)
      }
      return res
    } else {
      return ParseResult.error<T>(`Expected ${count} more characters`, this.offset)
    }
  }
}

class ParseResult<T> {
  constructor(
    public readonly data:
      | { tag: 'value'; value: T, unwindIndex: number }
      | { tag: 'error'; message: string; index: number }
  ) {}

  toString() {
    if (this.data.tag === 'value') {
      return this.data.value;
    } else {
      return 'Error: ' + this.data.message;
    }
  }

  static value<T>(value: T, unwindIndex: number) {
    return new ParseResult({ tag: 'value', value, unwindIndex });
  }

  static error<T>(message: string, index: number) {
    return new ParseResult<T>({ tag: 'error', message, index });
  }

  map<S>(fn : (t : T) => S): ParseResult<S> {
    if (this.data.tag === 'value') {
      return ParseResult.value(fn(this.data.value), this.data.unwindIndex)
    } else {
      return ParseResult.error(this.data.message, this.data.index)
    }
  }

  then<U>(fn: (value: T) => ParseResult<U>): ParseResult<U> {
    if (this.data.tag === 'value') {
      return fn(this.data.value)
    } else {
      return ParseResult.error(this.data.message, this.data.index)
    }
  }

  else<U>(fn: (message: string) => U): U {
    if (this.data.tag === 'value') {
      throw new Error('ParseResult.else called on a value')
    } else {
      return fn(this.data.message)
    }
  }
}

type Parser<T> = (buffer: TextBuffer) => ParseResult<T>;

function parseString(text: string): Parser<string> {
  return (buffer: TextBuffer) => {
    const unwindIndex = buffer.offset
    const l = buffer.get(text.length);
    if (l === text) {
      return ParseResult.value(l, unwindIndex);
    } else {
      buffer.unget(text.length);
      return ParseResult.error<string>(
        `Expected ${text} and got ${l}.`,
        buffer.offset
      );
    }
  };
}

function orParser<S, T>(p1: Parser<S>, p2: Parser<T>): Parser<S | T> {
  return state => {
    return p1(state).else(() => p2(state))
  }
}

function andParser<S, T>(p1: Parser<S>, p2: Parser<T>): Parser<[S, T]> {
  return buffer => {
    return p1(buffer).then(s => {
      return p2(buffer).map(t => {
        return [s, t] as [S, T]
      })
    })
  }
}

function andManyParser<T extends any[]>(...ps: Parser<T>[]): Parser<T> {
  // using recursion on andParser
  return state => {
    const results: any[] = []
    for (const p of ps) {
      const res = p(state)
      if (res.data.tag === 'error') {
        return res
      } else {
        results.push(res.data.value)
      }
    }
    return ParseResult.value(results as T, null as any /* TODO */)
  }
}

function parseAnd<A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> {
  return (buffer: TextBuffer) => {
    const resultA = a(buffer)

    if (resultA.data.tag === 'error') {
      return ParseResult<[A, B]>.error(resultA.data.message, resultA.data.index)
    } else {
      // A matched!
      const resultB = b(buffer)

      if (resultB.data.tag === 'error') {
        buffer.offset = resultA.data.unwindIndex
        return ParseResult<[A, B]>.error(resultB.data.message, resultB.data.index)
      } else {
        // B matched!
        return ParseResult.value([resultA.data.value, resultB.data.value], resultA.data.unwindIndex)
      }
    }
  };
}

function parseOr<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B> {
  return null as any;
}

function parseMaybe<A>(a: Parser<A>): Parser<A | undefined> {
  return null as any;
}

function parseMany<A>(a: Parser<A>): Parser<A[]> {
  return null as any;
}

/*

COMBINATOR PARSERS

parseSign
parseDigit

...combine those... into parseInteger
*/

const H_parser = parseString('H');
const e_parser = parseString('e');

const He_parser = parseAnd(H_parser, e_parser);

const buffer = new TextBuffer('Hallo, world');
const HorG_parser = parseOr(parseString('H'), parseString('G'))

console.log(He_parser(buffer).toString());

/*

















type Token =
  | { tag: 'number'; value: number }
  | { tag: 'symbol'; value: string };

function tokenize(buffer: string): Token[] {
  return buffer.split(' ').map((token) => {
    const num = Number(token);
    if (Number.isNaN(num)) {
      return { tag: 'symbol', value: token };
    } else {
      return { tag: 'number', value: num };
    }
  });
}

console.log(JSON.stringify(tokenize('3 + 4')));
*/
