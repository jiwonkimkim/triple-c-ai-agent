# Atlassian MCP 설정 가이드

Claude Code에서 Jira/Confluence를 사용하기 위한 MCP(Model Context Protocol) 설정 방법입니다.

## 사전 요구사항

- Node.js 18+ 설치
- Claude Code 설치
- Atlassian 계정 (Jira 접근 권한 필요)

## 설정 단계

### 1. Jira API 토큰 발급

1. [Atlassian API 토큰 관리 페이지](https://id.atlassian.com/manage-profile/security/api-tokens) 접속
2. **Create API token** 클릭
3. 토큰 이름 입력 (예: `claude-code-mcp`)
4. **Create** 클릭 후 토큰 복사 (이후 다시 볼 수 없음)

### 2. 환경변수 설정

터미널에서 아래 환경변수를 설정합니다.

#### macOS/Linux (zsh)

`~/.zshrc` 파일에 추가:

```bash
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token-here"
```

설정 적용:

```bash
source ~/.zshrc
```

#### macOS/Linux (bash)

`~/.bashrc` 또는 `~/.bash_profile` 파일에 추가:

```bash
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token-here"
```

설정 적용:

```bash
source ~/.bashrc
```

#### Windows (PowerShell)

```powershell
[System.Environment]::SetEnvironmentVariable('JIRA_EMAIL', 'your-email@example.com', 'User')
[System.Environment]::SetEnvironmentVariable('JIRA_API_TOKEN', 'your-api-token-here', 'User')
```

설정 후 터미널 재시작 필요

### 3. MCP 연결 확인

Claude Code 실행 후 `/mcp` 명령어로 연결 상태 확인:

```
/mcp
```

`Authentication successful. Connected to atlassian.` 메시지가 나오면 성공!

## 사용 가능한 기능

### Jira

| 기능 | 예시 |
|------|------|
| 이슈 검색 | "내가 담당한 이슈 보여줘" |
| 이슈 조회 | "PROJ-123 이슈 상세 정보 알려줘" |
| 이슈 생성 | "새 버그 이슈 만들어줘" |
| 이슈 수정 | "PROJ-123 설명 업데이트해줘" |
| 상태 변경 | "이 이슈 Done으로 변경해줘" |
| 댓글 추가 | "이슈에 코멘트 달아줘" |
| 작업 시간 기록 | "2시간 작업 로그 추가해줘" |

### Confluence

| 기능 | 예시 |
|------|------|
| 통합 검색 | "API 문서 검색해줘" |
| 페이지 조회 | "해당 Confluence 페이지 내용 보여줘" |

## 문제 해결

### "Authentication failed" 오류

- `JIRA_EMAIL`이 Atlassian 계정 이메일과 일치하는지 확인
- API 토큰이 올바르게 복사되었는지 확인
- 환경변수 설정 후 터미널을 재시작했는지 확인

### "Permission denied" 오류

- 해당 Jira 프로젝트에 대한 접근 권한이 있는지 확인
- Atlassian 관리자에게 권한 요청 필요

### 환경변수 확인 방법

```bash
echo $JIRA_EMAIL
echo $JIRA_API_TOKEN
```

값이 출력되지 않으면 환경변수가 설정되지 않은 것입니다.

## 보안 주의사항

- API 토큰은 절대 코드에 직접 입력하지 마세요
- `.env` 파일 사용 시 반드시 `.gitignore`에 추가
- API 토큰이 노출된 경우 즉시 폐기하고 새로 발급
