/**
 * Naver Place Review HTML 구조 조사 스크립트
 *
 * 실행 방법:
 * npx ts-node -r tsconfig-paths/register scripts/investigate-naver-review.ts <naverPlaceId>
 *
 * 예시:
 * npx ts-node -r tsconfig-paths/register scripts/investigate-naver-review.ts 1234567890
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function investigateNaverReview(naverPlaceId: string): Promise<void> {
  console.log('\n=== Naver Place Review HTML 구조 조사 ===\n');
  console.log(`Place ID: ${naverPlaceId}`);
  console.log(`URL: https://pcmap.place.naver.com/place/${naverPlaceId}\n`);

  const browser: Browser = await puppeteer.launch({
    headless: false, // 브라우저 창 표시
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page: Page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    const url = `https://pcmap.place.naver.com/place/${naverPlaceId}`;
    console.log(`[1] 페이지 접속 중...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ 페이지 로드 완료\n');

    // 2초 대기 (동적 콘텐츠 로딩)
    await sleep(2000);

    // iframe 확인
    console.log('[2] iframe 존재 여부 확인...');
    const frames = page.frames();
    console.log(`   총 ${frames.length}개 프레임 발견`);
    frames.forEach((frame, idx) => {
      console.log(`   - Frame ${idx}: ${frame.url()}`);
    });

    // 리뷰 탭 자동 전환 확인
    console.log('\n[3] 리뷰 탭 확인...');
    const reviewTabSelectors = [
      'a[href*="review"]',
      'button[aria-label*="리뷰"]',
      '.tab_review',
      '[role="tab"]:has-text("리뷰")',
    ];

    for (const selector of reviewTabSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`   ✅ 리뷰 탭 발견: ${selector}`);
          const text = await page.evaluate(el => el?.textContent, element);
          console.log(`   텍스트: "${text}"`);

          // 리뷰 탭 클릭
          await element.click();
          console.log('   리뷰 탭 클릭 완료');
          await sleep(2000);
          break;
        }
      } catch (error) {
        // Skip
      }
    }

    // iframe으로 전환
    console.log('\n[3.5] iframe으로 전환...');
    await sleep(1000);
    const allFrames = page.frames();
    console.log(`   현재 ${allFrames.length}개 프레임:`);
    allFrames.forEach((f, idx) => {
      console.log(`   - Frame ${idx}: ${f.url()}`);
    });

    // /review가 포함된 iframe 찾기
    let targetFrame = allFrames.find(f => f.url().includes('/review'));

    if (targetFrame) {
      console.log(`   ✅ 리뷰 iframe 발견: ${targetFrame.url()}`);
    } else {
      // /review가 없으면 naverPlaceId 포함하는 iframe 사용
      targetFrame = allFrames.find(f => f.url().includes(naverPlaceId) && f !== page.mainFrame());
      if (targetFrame) {
        console.log(`   ✅ Place iframe 발견 (review 없음): ${targetFrame.url()}`);
      } else {
        console.log('   ⚠️  iframe을 찾을 수 없습니다. 메인 페이지에서 탐색합니다.');
        targetFrame = page.mainFrame();
      }
    }

    // 이제 targetFrame에서 리뷰를 탐색
    const workingFrame = targetFrame;

    // 리뷰 섹션 selector 탐색
    console.log('\n[4] 리뷰 섹션 탐색 (iframe 내부)...');
    const reviewSectionSelectors = [
      '.place_section_content',
      '.review',
      '.review_list',
      '.place_review_list',
      '[class*="review"]',
      '[id*="review"]',
    ];

    let foundSection = false;
    for (const selector of reviewSectionSelectors) {
      try {
        const element = await workingFrame.$(selector);
        if (element) {
          console.log(`   ✅ 리뷰 섹션 발견: ${selector}`);
          const classes = await workingFrame.evaluate(el => el?.className, element);
          console.log(`   클래스: ${classes}`);
          foundSection = true;
        }
      } catch (error) {
        // Skip
      }
    }

    if (!foundSection) {
      console.log('   ⚠️  리뷰 섹션을 찾을 수 없습니다.');
    }

    // 개별 리뷰 아이템 탐색
    console.log('\n[5] 개별 리뷰 아이템 탐색...');
    const reviewItemSelectors = [
      '.place_section_review',
      '.review_item',
      '.review_li',
      '[class*="review"][class*="item"]',
      '[data-review-id]',
    ];

    let items: any[] = [];
    for (const selector of reviewItemSelectors) {
      try {
        const elements = await workingFrame.$$(selector);
        if (elements.length > 0) {
          console.log(`   ✅ 리뷰 아이템 발견: ${selector} (${elements.length}개)`);
          items = elements;
          break;
        }
      } catch (error) {
        // Skip
      }
    }

    if (items.length === 0) {
      console.log('   ⚠️  리뷰 아이템을 찾을 수 없습니다.');
      console.log('\niframe HTML 구조 저장 중...');
      const html = await workingFrame.content();
      const fs = require('fs');
      fs.writeFileSync('naver-place-iframe.html', html);
      console.log('✅ naver-place-iframe.html 파일에 저장됨');

      console.log('\n브라우저를 열어두었습니다. 수동으로 확인한 후 Enter를 눌러 종료하세요...');
      await new Promise(resolve => process.stdin.once('data', resolve));
      return;
    }

    // 첫 번째 리뷰 상세 조사
    console.log('\n[6] 첫 번째 리뷰 상세 조사...');
    const firstReview = items[0];

    // naverReviewId
    console.log('\n   [naverReviewId 추출]');
    const idSelectors = ['data-review-id', 'data-id', 'id'];
    for (const attr of idSelectors) {
      try {
        const value = await workingFrame.evaluate((el, attribute) => {
          return el?.getAttribute(attribute);
        }, firstReview, attr);
        if (value) {
          console.log(`   ✅ ${attr}: ${value}`);
        }
      } catch (error) {
        // Skip
      }
    }

    // reviewType
    console.log('\n   [reviewType 추출]');
    const typeSelectors = [
      '.review_type',
      '.type',
      '.type_badge',
      '[class*="type"]',
      '[class*="badge"]',
    ];
    for (const selector of typeSelectors) {
      try {
        const text = await workingFrame.evaluate((el, sel) => {
          const element = el?.querySelector(sel);
          return element?.textContent?.trim();
        }, firstReview, selector);
        if (text) {
          console.log(`   ✅ ${selector}: "${text}"`);
        }
      } catch (error) {
        // Skip
      }
    }

    // content
    console.log('\n   [content 추출]');
    const contentSelectors = [
      '.review_content',
      '.comment',
      '.comment_text',
      '[class*="content"]',
      '[class*="comment"]',
    ];
    for (const selector of contentSelectors) {
      try {
        const text = await workingFrame.evaluate((el, sel) => {
          const element = el?.querySelector(sel);
          return element?.textContent?.trim()?.substring(0, 50);
        }, firstReview, selector);
        if (text) {
          console.log(`   ✅ ${selector}: "${text}..."`);
        }
      } catch (error) {
        // Skip
      }
    }

    // rating
    console.log('\n   [rating 추출]');
    const ratingSelectors = [
      '.rating',
      '.star',
      '.star_score',
      '[class*="star"]',
      '[class*="grade"]',
      '[class*="rating"]',
    ];
    for (const selector of ratingSelectors) {
      try {
        const element = await workingFrame.evaluateHandle((el, sel) => {
          return el?.querySelector(sel);
        }, firstReview, selector);

        if (element) {
          const text = await workingFrame.evaluate(el => el?.textContent?.trim(), element);
          const ariaLabel = await workingFrame.evaluate(el => el?.getAttribute('aria-label'), element);
          const className = await workingFrame.evaluate(el => el?.className, element);
          console.log(`   ✅ ${selector}:`);
          if (text) console.log(`      텍스트: "${text}"`);
          if (ariaLabel) console.log(`      aria-label: "${ariaLabel}"`);
          if (className) console.log(`      className: "${className}"`);
        }
      } catch (error) {
        // Skip
      }
    }

    // author
    console.log('\n   [author 추출]');
    const authorSelectors = [
      '.reviewer',
      '.author',
      '.user',
      '.user_name',
      '.reviewer_name',
      '[class*="name"]',
      '[class*="user"]',
      '[class*="author"]',
    ];
    for (const selector of authorSelectors) {
      try {
        const text = await workingFrame.evaluate((el, sel) => {
          const element = el?.querySelector(sel);
          return element?.textContent?.trim();
        }, firstReview, selector);
        if (text) {
          console.log(`   ✅ ${selector}: "${text}"`);
        }
      } catch (error) {
        // Skip
      }
    }

    // publishedAt
    console.log('\n   [publishedAt 추출]');
    const dateSelectors = [
      '.date',
      '.time',
      '.publish_date',
      '.review_date',
      '[class*="date"]',
      '[class*="time"]',
    ];
    for (const selector of dateSelectors) {
      try {
        const text = await workingFrame.evaluate((el, sel) => {
          const element = el?.querySelector(sel);
          return element?.textContent?.trim();
        }, firstReview, selector);
        if (text) {
          console.log(`   ✅ ${selector}: "${text}"`);
        }
      } catch (error) {
        // Skip
      }
    }

    // iframe HTML 저장
    console.log('\n[7] iframe HTML 구조 저장 중...');
    const html = await workingFrame.content();
    const fs = require('fs');
    fs.writeFileSync('naver-place-iframe.html', html);
    console.log('✅ naver-place-iframe.html 파일에 저장됨');

    // 첫 번째 리뷰 HTML 저장
    const reviewHtml = await workingFrame.evaluate(el => el?.outerHTML, firstReview);
    fs.writeFileSync('naver-review-item.html', reviewHtml);
    console.log('✅ naver-review-item.html 파일에 저장됨');

    console.log('\n=== 조사 완료 ===');
    console.log('\n브라우저를 열어두었습니다. 수동으로 확인한 후 Enter를 눌러 종료하세요...');
    await new Promise(resolve => process.stdin.once('data', resolve));

  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    console.log('\n브라우저를 열어두었습니다. 수동으로 확인한 후 Enter를 눌러 종료하세요...');
    await new Promise(resolve => process.stdin.once('data', resolve));
  } finally {
    await browser.close();
  }
}

// CLI 실행
const naverPlaceId = process.argv[2];

if (!naverPlaceId) {
  console.error('Usage: npx ts-node -r tsconfig-paths/register scripts/investigate-naver-review.ts <naverPlaceId>');
  console.error('Example: npx ts-node -r tsconfig-paths/register scripts/investigate-naver-review.ts 1234567890');
  process.exit(1);
}

investigateNaverReview(naverPlaceId)
  .then(() => {
    console.log('\n조사 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n에러:', error);
    process.exit(1);
  });
