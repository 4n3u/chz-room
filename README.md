# chz-room (치즈룸)

네이버 치지직(CHZZK) 연동 실시간 유튜브 동시시청 서비스

## 실행 방법

### 1. 개발 환경 (Development)

루트 디렉토리에서 프론트엔드와 백엔드를 동시에 실행합니다.

```bash
npm run dev
```

- 클라이언트: `http://localhost:5173`
- 서버: `http://localhost:4000`

### 2. 프로덕션 배포 (Production)

빌드 후 백엔드 단일 프로세스만 실행하여 프론트엔드까지 한 번에 서빙합니다.

```bash
npm run build
npm start
```

- 서비스 접속: `http://localhost:4000`

## 환경 변수 (.env)

`server/.env.example` 파일을 복사하여 `server/.env`를 생성하고 설정합니다.

```env
PORT=4000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
CHZZK_CLIENT_ID=your_chzzk_client_id
CHZZK_CLIENT_SECRET=your_chzzk_client_secret
CHZZK_REDIRECT_URI=http://localhost:4000/api/auth/chzzk/callback
```
