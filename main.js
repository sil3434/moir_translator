//단어 클래스
class Word {
  constructor({ wordId = 0, syllables = [] }) {
    this.wordId = wordId; //단어의 구분
    this.syllables = syllables; //어절의 구분
  }
}
//한 음절에 표기되어야할, 글립스를 담은 음절 클래스
class Syllable {
  constructor({ syllableId = 0, glyphs = [] }) {
    this.syllableId = syllableId; //어절의 구분
    this.glyphs = glyphs; //글자 목록
  }
}
//a,b,c등 이미지 파일과 연결될 클래스
class Glyph {
  constructor({
    char,
    isVowel = false,
    isCombinedVowel = false,
    imagePath = "",
    isLetter = true,
  }) {
    this.char = char; //글자
    this.isVowel = isVowel; //모음 여부
    this.isCombinedVowel = isCombinedVowel; //결합형 모음 여부
    this.imagePath = imagePath; //이미지 경로
    this.isLetter = isLetter; //문자 여부
  }
}
// Glyph(글자) -> Syllable(음절) -> Word(단어) -> text(사용자 입력 문장(string))
// ex. ㄱ -> 기 -> 기억 -> 기억을 위하여

//===

const vowels = ["a", "e", "i", "o", "u"];
const doubleLetters = ["l", "n", "s"];

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      console.warn("이미지 경로가 undefined입니다");
      reject("Invalid image path");
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(`이미지를 불러올 수 없습니다: ${src}`);
  });
}

function isValidChar(char) {
  const validPunctuation = [".", ",", "!", "?"];
  return (
    (char >= "a" && char <= "z") ||
    //  (char >= "0" && char <= "9") ||
    validPunctuation.includes(char)
  );
}

function isLetter(char) {
  return char >= "a" && char <= "z";
}

function handlePuncAndNumber(char, imagesBasePath) {
  if (char === ".") {
    return new Glyph({
      char: char,
      imagePath: `${imagesBasePath}markS.svg`,
      isLetter: false,
    });
  } else if (char === ",") {
    return new Glyph({
      char: char,
      imagePath: `${imagesBasePath}markR.svg`,
      isLetter: false,
    });
  } else if (char == "!") {
    return new Glyph({
      char: char,
      imagePath: `${imagesBasePath}markE.svg`,
      isLetter: false,
    });
  } else if (char == "?") {
    return new Glyph({
      char: char,
      imagePath: `${imagesBasePath}markQ.svg`,
      isLetter: false,
    });
  } else if (char >= "0" && char <= "9") {
    return new Glyph({
      char: char,
      imagePath: `${imagesBasePath}${char}.svg`,
      isLetter: false,
    });
  }
}
// ... "longWord"를 판단하는 기준에 결합모음이 포함되지 않는다면?
// 이런 함수가 하나 필요할지도

function getWordLength(word) {
  //자음이 개수만큼 +1
  //문장부호는 무시
  //
}

function getGlyphs(text, imagesBasePath) {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const words = line.split(" ").map((word, wordId) => {
      const glyphs = [];
      const chars = word.split("");

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i].toLowerCase();
        if (!isValidChar(char)) continue; // undefined, null, "" 방어

        //문장부호, 숫자는 문자와 결합하지 않도록 별도 처리
        if (!isLetter(char)) {
          const newGlyph = handlePuncAndNumber(char, imagesBasePath);
          glyphs.push(newGlyph);
        } else {
          const nextChar = chars[i + 1];
          if (doubleLetters.includes(char) && nextChar === char) {
            glyphs.push(
              new Glyph({
                char: char + char,
                isVowel: false,
                imagePath: char ? `${imagesBasePath}${char + char}.svg` : "",
                isLetter: true,
              })
            );
            i++;
          } else {
            glyphs.push(
              new Glyph({
                char,
                isVowel: vowels.includes(char),
                imagePath: char ? `${imagesBasePath}${char}.svg` : "",
                isLetter: true,
              })
            );
          }
        }
      }
      return new Word({
        wordId,
        syllables: [new Syllable({ syllableId: 0, glyphs })],
      });
    });
    return words;
  });
}

function assignSyllableId(word, imagesBasePath) {
  const glyphs = word.syllables[0].glyphs;
  const isLongWord = glyphs.filter((glyph) => glyph.isLetter).length >= 3;

  let newSyllables = [];

  if (!isLongWord) {
    newSyllables = glyphs.map(
      (glyph, index) =>
        new Syllable({
          glyphs: [glyph],
          syllableId: index,
        })
    );
  } else {
    const combindedGlyphs = glyphs.map((glyph, index) => {
      const newGlyph = new Glyph({
        char: glyph.char,
        isVowel: glyph.isVowel,
        isCombinedVowel: glyph.isVowel,
        imagePath: glyph.imagePath,
        isLetter: glyph.isLetter,
      });
      if (glyph.isVowel) {
        if (index > 0 && glyphs[index - 1].isVowel) {
          newGlyph.isCombinedVowel = false;
        } else {
          newGlyph.imagePath = `${imagesBasePath}${glyph.char}2.svg`;
        }
      }
      return newGlyph;
    });

    let currentSyllableGlyphs = [];
    let syllableId = 0;
    const resultSyllables = [];

    for (let i = 0; i < combindedGlyphs.length; i++) {
      const current = combindedGlyphs[i];
      const prev = combindedGlyphs[i - 1];

      // Handle non-letter characters (punctuation, numbers etc)
      if (!current.isLetter) {
        if (currentSyllableGlyphs.length > 0) {
          resultSyllables.push(
            new Syllable({
              glyphs: [...currentSyllableGlyphs],
              syllableId: syllableId++,
            })
          );
          currentSyllableGlyphs = [];
        }

        resultSyllables.push(
          new Syllable({
            glyphs: [current],
            syllableId: syllableId++,
          })
        );
        continue;
      }

      if (i === 0 || prev?.isCombinedVowel) {
        currentSyllableGlyphs.push(current);
      } else {
        if (currentSyllableGlyphs.length > 0) {
          resultSyllables.push(
            new Syllable({
              glyphs: [...currentSyllableGlyphs],
              syllableId: syllableId++,
            })
          );
        }
        currentSyllableGlyphs = [current];
      }
    }

    if (currentSyllableGlyphs.length > 0) {
      resultSyllables.push(
        new Syllable({
          glyphs: [...currentSyllableGlyphs],
          syllableId: syllableId++,
        })
      );
    }
    newSyllables = resultSyllables;
  }

  const lastSyllable = newSyllables[newSyllables.length - 1];
  const lastGlyph = lastSyllable.glyphs[lastSyllable.glyphs.length - 1];

  console.log("1");
  console.log("lastSyllable is Letter?", lastGlyph.isLetter);
  console.log("lastSyllable.glyphs.length", lastSyllable.glyphs.length);

  if (lastGlyph.isVowel) {
    console.log("2");
    lastSyllable.glyphs.push(
      new Glyph({
        char: "done",
        imagePath: `${imagesBasePath}done.svg`,
      })
    );
  }
  //마지막 글립스가 문장부호인 경우, 마지막 문자를 찾아 모음 검사를 한다.
  // 음... lastSyllable.glyphs.length > 1 이부분 조건문 바꿔야됨
  else if (!lastGlyph.isLetter && lastSyllable.glyphs.length > 1) {
    console.log("3");
    console.log("lastSyllable", lastSyllable);
    const lastLetterGlyph = lastSyllable.glyphs.find((glyph, index) => {
      return glyph.isLetter && index < lastSyllable.glyphs.length - 1;
    });
    console.log("lastLetterGlyph", lastLetterGlyph);
    if (lastLetterGlyph.isVowel) {
      lastLetterGlyph.glyphs.push(
        new Glyph({
          char: "done",
          imagePath: `${imagesBasePath}done.svg`,
        })
      );
    }
  }
  return newSyllables;
}

function translation(text, imagesBasePath) {
  const wordLines = getGlyphs(text, imagesBasePath);
  return wordLines.map((words) => {
    return words.map(
      (word) =>
        new Word({
          wordId: word.wordId,
          syllables: assignSyllableId(word, imagesBasePath),
        })
    );
  });
}

//====

async function renderImages(text, ctx, canvas, imagesBasePath = "./images/") {
  clearCanvas(ctx, canvas);
  const lines = translation(text, imagesBasePath);
  console.log("result", lines);
  const scale = 1;
  const charWidth = 150 * scale;
  const charHeight = 150 * scale;
  const letterSpacing =
    parseInt(document.getElementById("letterSpacing").value) || 0;
  const wordSpacing =
    parseInt(document.getElementById("wordSpacing").value) || 0;
  const lineSpacing =
    parseInt(document.getElementById("lineSpacing").value) || 0;

  const cPadding = 40;

  const lineWidths = lines.map(
    (line) =>
      line.reduce((sum, word) => {
        const wordWidth =
          word.syllables.length * charWidth +
          letterSpacing * (word.syllables.length - 1);
        return sum + wordWidth;
      }, 0) +
      (line.length - 1) * wordSpacing
  );
  const maxLineWidth = Math.max(...lineWidths);

  console.log("lineWidths", lineWidths);
  console.log("maxLineWidth", maxLineWidth);

  canvas.width = maxLineWidth + cPadding;
  canvas.height = charHeight + lineSpacing * (lines.length - 1) + cPadding;
  canvas.style.backgroundColor = "white";
  //아래 for문으로 한 줄을 생성
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const words = lines[lineIndex];
    let x = 10;
    let y = 20 + lineIndex * lineSpacing;

    for (let i = 0; i < words.length; i++) {
      //아래 for문으로 하나의 단어를 생성
      for (let j = 0; j < words[i].syllables.length; j++) {
        const syllableIncluded = words[i].syllables[j];
        const glyphs = syllableIncluded.glyphs;

        if (glyphs.length === 1) {
          const glyph = glyphs[0];
          const img = await loadImage(glyph.imagePath);
          ctx.drawImage(img, x, y, charWidth, charHeight);
          x += charWidth + letterSpacing;
        } else if (glyphs.length === 2) {
          const [glyph1, glyph2] = glyphs;
          const img1 = await loadImage(glyph1.imagePath);
          const img2 = await loadImage(glyph2.imagePath);

          const glyph1Height =
            glyph2.char === "done" ? charHeight * 0.75 : charHeight * 0.3;
          const glyph2Height = charHeight - glyph1Height;

          ctx.drawImage(img1, x, y, charWidth, glyph1Height);
          ctx.drawImage(img2, x, y + glyph1Height, charWidth, glyph2Height);
          x += charWidth + letterSpacing;
        } else if (glyphs.length === 3) {
          // 결합형모음+단일형모음+done의 조합
          const [glyph1, glyph2, glyph3] = glyphs;
          const img1 = await loadImage(glyph1.imagePath);
          const img2 = await loadImage(glyph2.imagePath);
          const img3 = await loadImage(glyph3.imagePath);

          const glyph1Height = charHeight * 0.3;
          const glyph3Height = charHeight * 0.1;
          const glyph2Height = charHeight - glyph1Height - glyph3Height;

          ctx.drawImage(img1, x, y, charWidth, glyph1Height);
          ctx.drawImage(img2, x, y + glyph1Height, charWidth, glyph2Height);
          ctx.drawImage(
            img3,
            x,
            y + glyph1Height + glyph2Height,
            charWidth,
            glyph3Height
          );
          x += charWidth + wordSpacing;
        } else {
          console.log("예상치 못한 케이스 ");
          console.log("glyphs", glyphs);
        }
      }
      x += wordSpacing;
    }
  }
}

function saveImage(text, ctx, canvas) {
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "output.png";
  link.click();
}

// 이벤트 연결
const input = document.getElementById("input");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

document.getElementById("saveBtn").addEventListener("click", () => {
  saveImage(input.value.trim(), ctx, canvas);
});

document.getElementById("renderBtn").addEventListener("click", () => {
  const text = input.value.trim();
  if (text) {
    renderImages(text, ctx, canvas);
    document.getElementById("saveBtn").disabled = false;
  }
});
