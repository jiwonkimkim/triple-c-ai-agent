# Docker 개발 환경 설정 가이드

팀원들이 동일한 환경에서 프로젝트를 실행할 수 있도록 Docker를 사용합니다.

## 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- Git

## 빠른 시작

### 1. 프로젝트 클론

```bash
git clone https://github.com/joycha3110/Triple_C.git
cd Triple_C
```

### 2. 환경 변수 설정

```bash
# .env.docker.example을 복사하여 .env.docker 생성
cp .env.docker.example .env.docker

# 필요에 따라 .env.docker 파일 수정
# (기본값으로도 테스트 가능)
```

### 3. Docker 실행

```bash
# 컨테이너 빌드 및 실행
docker-compose up --build

# 백그라운드에서 실행하려면
docker-compose up -d --build
```

### 4. 데이터베이스 마이그레이션

새 터미널에서:

```bash
# 컨테이너 내부에서 Prisma 마이그레이션 실행
docker-compose exec app npx prisma migrate dev

# 또는 기존 마이그레이션만 적용
docker-compose exec app npx prisma migrate deploy
```

### 5. 접속

- 앱: http://localhost:3000
- DB: localhost:5433 (외부 접속 시)

## 자주 사용하는 명령어

```bash
# 컨테이너 시작
docker-compose up

# 컨테이너 시작 (백그라운드)
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 컨테이너 로그 확인
docker-compose logs -f app

# 컨테이너 내부 접속
docker-compose exec app sh

# Prisma Studio 실행 (DB 확인)
docker-compose exec app npx prisma studio

# 의존성 재설치 (package.json 변경 시)
docker-compose up --build

# 볼륨 포함 완전 삭제 후 재시작
docker-compose down -v
docker-compose up --build
```

## 문제 해결

### 포트 충돌

```bash
# 3000 또는 5433 포트가 사용 중인 경우
# docker-compose.yml에서 포트 변경
# "3001:3000" 또는 "5434:5432"
```

### node_modules 문제

```bash
# node_modules 볼륨 삭제 후 재빌드
docker-compose down -v
docker-compose up --build
```

### 데이터베이스 초기화

```bash
# 모든 데이터 삭제 후 새로 시작
docker-compose down -v
docker-compose up -d postgres
docker-compose exec app npx prisma migrate reset
```

### 코드 변경이 반영되지 않는 경우

```bash
# 컨테이너 재시작
docker-compose restart app
```

## Docker 없이 로컬 실행

Docker를 사용하지 않고 로컬에서 직접 실행하려면:

```bash
# 1. PostgreSQL 설치 및 실행 (또는 Docker로 DB만 실행)
docker-compose up -d postgres

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL 수정:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5433/triple_c?schema=public"

# 4. Prisma 마이그레이션
npx prisma migrate dev

# 5. 개발 서버 실행
npm run dev
```

## 팀원별 작업 흐름

1. `git pull origin main` - 최신 코드 가져오기
2. `docker-compose up --build` - 변경사항 반영하여 실행
3. 작업 후 `docker-compose down` - 컨테이너 종료
