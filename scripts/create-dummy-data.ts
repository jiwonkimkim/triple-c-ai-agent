import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const prisma = new PrismaClient();

async function main() {
  // 개발자 계정 찾기
  const devUser = await prisma.user.findFirst({
    where: {
      email: { contains: 'dev' }
    }
  });

  if (!devUser) {
    console.log('❌ 개발자 계정을 찾을 수 없습니다. 먼저 로그인해주세요.');
    return;
  }

  console.log(`✅ 사용자: ${devUser.email} (${devUser.id})`);

  // 브랜드 프로필 생성 - 나이키, 스타벅스
  console.log('\n📦 브랜드 프로필 생성 중...');

  const brands = [
    {
      name: 'Nike',
      identity: '세계 최고의 스포츠 브랜드. Just Do It 정신으로 모든 운동선수들에게 영감을 주는 브랜드입니다.',
      toneAndManner: '역동적이고 영감을 주는 톤. 도전정신과 열정을 강조하며, 간결하고 임팩트 있는 메시지를 전달합니다.',
      voiceTone: '자신감 있고 동기부여적인 목소리. 스포츠의 힘과 인간의 가능성을 믿는 브랜드.',
      imageKeywords: ['스포츠', '역동적', '운동', '열정', '도전', '승리'],
      websiteUrl: 'https://www.nike.com',
      instagramUrl: 'https://www.instagram.com/nike',
    },
    {
      name: 'Starbucks',
      identity: '프리미엄 커피 경험을 제공하는 글로벌 카페 브랜드. 제3의 공간으로서 편안함과 커뮤니티를 제공합니다.',
      toneAndManner: '따뜻하고 친근한 톤. 커피 문화에 대한 열정과 고객과의 연결을 중시하며, 환경과 지역사회에 대한 책임감을 강조합니다.',
      voiceTone: '환영하는 느낌의 따뜻한 목소리. 커피 한 잔에 담긴 이야기와 사람들의 연결을 소중히 여기는 브랜드.',
      imageKeywords: ['커피', '프리미엄', '따뜻함', '카페', '녹색', '친환경'],
      websiteUrl: 'https://www.starbucks.com',
      instagramUrl: 'https://www.instagram.com/starbucks',
    },
  ];

  for (const brand of brands) {
    const existing = await prisma.brandProfile.findFirst({
      where: { name: brand.name, userId: devUser.id }
    });

    if (existing) {
      console.log(`  ⏭️  ${brand.name} - 이미 존재함`);
    } else {
      await prisma.brandProfile.create({
        data: {
          userId: devUser.id,
          ...brand,
        },
      });
      console.log(`  ✅ ${brand.name} 생성 완료`);
    }
  }

  // 뷰티 카테고리 프로젝트 3개 생성
  console.log('\n🎨 뷰티 프로젝트 생성 중...');

  const beautyProjects = [
    {
      title: '글로우 세럼 상세페이지',
      description: '피부에 광채를 더해주는 비타민C 세럼 상세페이지입니다.',
      productName: '비타민C 글로우 세럼',
      category: 'BEAUTY',
      keyFeatures: ['비타민C 15% 함유', '브라이트닝 효과', '항산화 성분', '저자극 포뮬러'],
      targetAudience: '20-40대 여성, 피부 톤 개선을 원하는 분',
    },
    {
      title: '히알루론산 크림 상세페이지',
      description: '깊은 보습을 제공하는 히알루론산 크림 상세페이지입니다.',
      productName: '딥 하이드레이션 크림',
      category: 'BEAUTY',
      keyFeatures: ['3중 히알루론산', '72시간 보습', '세라마이드 함유', '피부장벽 강화'],
      targetAudience: '건성/민감성 피부, 보습이 필요한 모든 연령대',
    },
    {
      title: '클렌징 오일 상세페이지',
      description: '순하게 메이크업을 지워주는 클렌징 오일 상세페이지입니다.',
      productName: '젠틀 클렌징 오일',
      category: 'BEAUTY',
      keyFeatures: ['식물성 오일 베이스', '워터프루프 메이크업 제거', '피부 자극 최소화', '촉촉한 세정'],
      targetAudience: '메이크업을 자주 하는 분, 순한 클렌저를 찾는 분',
    },
  ];

  for (const project of beautyProjects) {
    const existing = await prisma.project.findFirst({
      where: { title: project.title, ownerId: devUser.id }
    });

    if (existing) {
      console.log(`  ⏭️  ${project.title} - 이미 존재함`);
    } else {
      await prisma.project.create({
        data: {
          ownerId: devUser.id,
          ...project,
          copyLength: 'medium',
          status: 'ACTIVE',
        },
      });
      console.log(`  ✅ ${project.title} 생성 완료`);
    }
  }

  console.log('\n🎉 더미 데이터 생성 완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
