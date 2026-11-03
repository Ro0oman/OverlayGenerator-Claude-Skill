// Strings for the conversion pieces of the home page: demo-first CTAs, the prompt
// generator and the "what happens with your data" section. One entry per language.
const CONV = {
es: {
  ctaDemo: 'Prueba la demo →', ctaWant: 'Quiero uno así para mi canal →',
  gen: {
    ey: 'Crea el tuyo', t: 'Te escribimos el prompt', l: 'Rellena lo que sepas de tu directo y copia la frase en Claude. Cuanto más concreto, más tuyo será el pack.',
    channel: 'Tu canal de Twitch (opcional)', game: '¿Qué haces en directo?', gamePh: 'Dark Souls por primera vez, charla de noticias, Minecraft hardcore…',
    rule: '¿Alguna regla o gimmick?', rulePh: 'cada muerte son 3 flexiones, subathon de 7 días…',
    tone: 'Tono', tones: ['épico', 'gracioso', 'tranquilo', 'retro', 'minimalista'],
    cam: 'Cámara', cams: ['uso cámara', 'soy VTuber', 'no uso cámara'],
    pieces: 'Piezas que quieres', pieceList: ['contador de muertes', 'tracker de jefes', 'agenda de temas', 'contador de días', 'objetivo de subs', 'temporizador de subathon'],
    out: 'Tu prompt', copy: 'Copiar prompt', copied: '¡Copiado!', next: 'Ahora instala la skill ↓',
    p: { open: 'Hazme un pack de overlays para OBS.', channel: 'Mi canal es twitch.tv/{v}.', game: 'Hago directos de {v}', rule: ', con esta regla: {v}', tone: 'Quiero un tono {v}.', pieces: 'Me gustaría que incluyera: {v}.', and: ' y ' },
  },
  priv: {
    ey: 'Privacidad', t: 'Qué pasa con tus datos',
    items: [
      ['Lo que mira Claude', 'Tu canal público de Twitch: qué juegas, títulos y cómo habla tu chat. Lo mismo que vería cualquier espectador. No necesita tu contraseña ni acceso a tu cuenta.'],
      ['Lo que se queda en tu ordenador', 'El pack son archivos locales. Contadores y ajustes se guardan dentro de tu perfil de OBS. No hay servidor ni cuenta nuestra.'],
      ['Cómo se conecta a OBS', 'Por el WebSocket que trae OBS, solo en tu equipo o tu red local. El chat se lee de forma anónima, como un espectador sin sesión.'],
    ],
  },
},
en: {
  ctaDemo: 'Try the demo →', ctaWant: 'I want one like this for my channel →',
  gen: {
    ey: 'Make yours', t: 'We write the prompt for you', l: 'Fill in what you know about your stream and paste the line into Claude. The more specific, the more yours the pack will be.',
    channel: 'Your Twitch channel (optional)', game: 'What do you do on stream?', gamePh: 'first Dark Souls run, news talk show, Minecraft hardcore…',
    rule: 'Any rule or gimmick?', rulePh: 'every death is 3 push-ups, 7-day subathon…',
    tone: 'Tone', tones: ['epic', 'funny', 'chill', 'retro', 'minimal'],
    cam: 'Camera', cams: ['I use a camera', 'I am a VTuber', 'no camera'],
    pieces: 'Pieces you want', pieceList: ['death counter', 'boss tracker', 'topic agenda', 'day counter', 'sub goal', 'subathon timer'],
    out: 'Your prompt', copy: 'Copy prompt', copied: 'Copied!', next: 'Now install the skill ↓',
    p: { open: 'Make me an OBS overlay pack.', channel: 'My channel is twitch.tv/{v}.', game: 'I stream {v}', rule: ', with this rule: {v}', tone: 'I want a {v} tone.', pieces: 'I would like it to include: {v}.', and: ' and ' },
  },
  priv: {
    ey: 'Privacy', t: 'What happens with your data',
    items: [
      ['What Claude looks at', 'Your public Twitch channel: what you play, titles and how your chat talks. The same any viewer sees. No password or account access needed.'],
      ['What stays on your computer', 'The pack is local files. Counters and settings are saved inside your OBS profile. No server, no account on our side.'],
      ['How it connects to OBS', 'Through the WebSocket built into OBS, only on your machine or local network. Chat is read anonymously, like a logged-out viewer.'],
    ],
  },
},
pt: {
  ctaDemo: 'Teste a demo →', ctaWant: 'Quero um assim para o meu canal →',
  gen: {
    ey: 'Crie o seu', t: 'A gente escreve o prompt', l: 'Preencha o que souber da sua live e cole a frase no Claude. Quanto mais específico, mais seu será o pack.',
    channel: 'Seu canal da Twitch (opcional)', game: 'O que você faz na live?', gamePh: 'Dark Souls pela primeira vez, bate-papo de notícias, Minecraft hardcore…',
    rule: 'Alguma regra ou gimmick?', rulePh: 'cada morte são 3 flexões, subathon de 7 dias…',
    tone: 'Tom', tones: ['épico', 'engraçado', 'tranquilo', 'retrô', 'minimalista'],
    cam: 'Câmera', cams: ['uso câmera', 'sou VTuber', 'sem câmera'],
    pieces: 'Peças que você quer', pieceList: ['contador de mortes', 'tracker de chefes', 'pauta de temas', 'contador de dias', 'meta de subs', 'timer de subathon'],
    out: 'Seu prompt', copy: 'Copiar prompt', copied: 'Copiado!', next: 'Agora instale a skill ↓',
    p: { open: 'Faz um pack de overlays para OBS pra mim.', channel: 'Meu canal é twitch.tv/{v}.', game: 'Faço lives de {v}', rule: ', com esta regra: {v}', tone: 'Quero um tom {v}.', pieces: 'Gostaria que incluísse: {v}.', and: ' e ' },
  },
  priv: {
    ey: 'Privacidade', t: 'O que acontece com seus dados',
    items: [
      ['O que o Claude olha', 'Seu canal público da Twitch: o que você joga, títulos e como seu chat fala. O mesmo que qualquer espectador vê. Sem senha nem acesso à conta.'],
      ['O que fica no seu computador', 'O pack são arquivos locais. Contadores e ajustes ficam no seu perfil do OBS. Sem servidor nem conta nossa.'],
      ['Como conecta ao OBS', 'Pelo WebSocket do próprio OBS, só no seu computador ou rede local. O chat é lido de forma anônima.'],
    ],
  },
},
fr: {
  ctaDemo: 'Essayer la démo →', ctaWant: 'Je veux le même pour ma chaîne →',
  gen: {
    ey: 'Crée le tien', t: 'On t’écrit le prompt', l: 'Remplis ce que tu sais de ton stream et colle la phrase dans Claude. Plus c’est précis, plus le pack te ressemblera.',
    channel: 'Ta chaîne Twitch (optionnel)', game: 'Que fais-tu en live ?', gamePh: 'Dark Souls pour la première fois, talk d’actu, Minecraft hardcore…',
    rule: 'Une règle ou un gimmick ?', rulePh: 'chaque mort = 3 pompes, subathon de 7 jours…',
    tone: 'Ton', tones: ['épique', 'drôle', 'chill', 'rétro', 'minimaliste'],
    cam: 'Caméra', cams: ['j’utilise une caméra', 'je suis VTuber', 'pas de caméra'],
    pieces: 'Pièces souhaitées', pieceList: ['compteur de morts', 'suivi des boss', 'programme des sujets', 'compteur de jours', 'objectif de subs', 'timer de subathon'],
    out: 'Ton prompt', copy: 'Copier le prompt', copied: 'Copié !', next: 'Maintenant, installe la skill ↓',
    p: { open: 'Fais-moi un pack d’overlays OBS.', channel: 'Ma chaîne est twitch.tv/{v}.', game: 'Je streame {v}', rule: ', avec cette règle : {v}', tone: 'Je veux un ton {v}.', pieces: 'J’aimerais qu’il inclue : {v}.', and: ' et ' },
  },
  priv: {
    ey: 'Confidentialité', t: 'Ce qu’il advient de tes données',
    items: [
      ['Ce que Claude regarde', 'Ta chaîne Twitch publique : ce que tu joues, tes titres et le ton de ton chat. Ce que voit n’importe quel spectateur. Aucun mot de passe ni accès au compte.'],
      ['Ce qui reste sur ton ordinateur', 'Le pack, ce sont des fichiers locaux. Compteurs et réglages sont dans ton profil OBS. Pas de serveur ni de compte chez nous.'],
      ['Comment il se connecte à OBS', 'Via le WebSocket intégré à OBS, uniquement sur ta machine ou ton réseau local. Le chat est lu anonymement.'],
    ],
  },
},
de: {
  ctaDemo: 'Demo ausprobieren →', ctaWant: 'So eins will ich für meinen Kanal →',
  gen: {
    ey: 'Mach deins', t: 'Wir schreiben dir den Prompt', l: 'Füll aus, was du über deinen Stream weißt, und füge den Satz in Claude ein. Je genauer, desto mehr wird das Paket deins.',
    channel: 'Dein Twitch-Kanal (optional)', game: 'Was machst du im Stream?', gamePh: 'Dark Souls zum ersten Mal, News-Talk, Minecraft Hardcore…',
    rule: 'Eine Regel oder ein Gimmick?', rulePh: 'jeder Tod = 3 Liegestütze, 7-Tage-Subathon…',
    tone: 'Ton', tones: ['episch', 'lustig', 'entspannt', 'retro', 'minimal'],
    cam: 'Kamera', cams: ['mit Kamera', 'ich bin VTuber', 'ohne Kamera'],
    pieces: 'Gewünschte Teile', pieceList: ['Todeszähler', 'Boss-Tracker', 'Themenagenda', 'Tageszähler', 'Sub-Ziel', 'Subathon-Timer'],
    out: 'Dein Prompt', copy: 'Prompt kopieren', copied: 'Kopiert!', next: 'Jetzt den Skill installieren ↓',
    p: { open: 'Mach mir ein OBS-Overlay-Paket.', channel: 'Mein Kanal ist twitch.tv/{v}.', game: 'Ich streame {v}', rule: ', mit dieser Regel: {v}', tone: 'Ich möchte einen {v}en Ton.', pieces: 'Es soll enthalten: {v}.', and: ' und ' },
  },
  priv: {
    ey: 'Datenschutz', t: 'Was mit deinen Daten passiert',
    items: [
      ['Was Claude sich ansieht', 'Deinen öffentlichen Twitch-Kanal: was du spielst, Titel und wie dein Chat redet. Das, was jeder Zuschauer sieht. Kein Passwort, kein Kontozugriff.'],
      ['Was auf deinem Rechner bleibt', 'Das Paket sind lokale Dateien. Zähler und Einstellungen liegen in deinem OBS-Profil. Kein Server, kein Konto bei uns.'],
      ['Wie es sich mit OBS verbindet', 'Über den eingebauten OBS-WebSocket, nur auf deinem Rechner oder im lokalen Netz. Der Chat wird anonym gelesen.'],
    ],
  },
},
it: {
  ctaDemo: 'Prova la demo →', ctaWant: 'Ne voglio uno così per il mio canale →',
  gen: {
    ey: 'Crea il tuo', t: 'Ti scriviamo il prompt', l: 'Compila quello che sai della tua live e incolla la frase in Claude. Più sei preciso, più il pack sarà tuo.',
    channel: 'Il tuo canale Twitch (facoltativo)', game: 'Cosa fai in live?', gamePh: 'Dark Souls per la prima volta, chiacchiere di attualità, Minecraft hardcore…',
    rule: 'Qualche regola o gimmick?', rulePh: 'ogni morte sono 3 flessioni, subathon di 7 giorni…',
    tone: 'Tono', tones: ['epico', 'divertente', 'rilassato', 'retrò', 'minimale'],
    cam: 'Webcam', cams: ['uso la webcam', 'sono VTuber', 'niente webcam'],
    pieces: 'Pezzi che vuoi', pieceList: ['contatore morti', 'tracker dei boss', 'scaletta argomenti', 'contatore giorni', 'obiettivo sub', 'timer subathon'],
    out: 'Il tuo prompt', copy: 'Copia il prompt', copied: 'Copiato!', next: 'Ora installa la skill ↓',
    p: { open: 'Fammi un pack di overlay per OBS.', channel: 'Il mio canale è twitch.tv/{v}.', game: 'Faccio live di {v}', rule: ', con questa regola: {v}', tone: 'Voglio un tono {v}.', pieces: 'Vorrei che includesse: {v}.', and: ' e ' },
  },
  priv: {
    ey: 'Privacy', t: 'Cosa succede ai tuoi dati',
    items: [
      ['Cosa guarda Claude', 'Il tuo canale Twitch pubblico: a cosa giochi, i titoli e come parla la tua chat. Quello che vede qualsiasi spettatore. Nessuna password né accesso all’account.'],
      ['Cosa resta sul tuo computer', 'Il pack sono file locali. Contatori e impostazioni restano nel tuo profilo OBS. Nessun server né account nostro.'],
      ['Come si collega a OBS', 'Tramite il WebSocket integrato in OBS, solo sul tuo computer o in rete locale. La chat viene letta in forma anonima.'],
    ],
  },
},
ja: {
  ctaDemo: 'デモを試す →', ctaWant: '自分のチャンネル用にほしい →',
  gen: {
    ey: '自分用を作る', t: 'プロンプトを作成します', l: '配信について分かることを入力して、出来た文章をClaudeに貼り付けてください。具体的なほど、あなたらしいパックになります。',
    channel: 'Twitchチャンネル（任意）', game: '配信では何をしていますか？', gamePh: '初めてのダークソウル、ニュース雑談、マイクラハードコア…',
    rule: 'ルールや企画は？', rulePh: '1デスごとに腕立て3回、7日間のサブアソン…',
    tone: 'トーン', tones: ['壮大', 'コミカル', 'まったり', 'レトロ', 'ミニマル'],
    cam: 'カメラ', cams: ['カメラあり', 'VTuber', 'カメラなし'],
    pieces: '欲しいパーツ', pieceList: ['死亡カウンター', 'ボストラッカー', 'トピック表', '日数カウンター', 'サブスク目標', 'サブアソンタイマー'],
    out: 'あなたのプロンプト', copy: 'コピー', copied: 'コピーしました！', next: '次にスキルをインストール ↓',
    p: { open: 'OBSのオーバーレイパックを作って。', channel: 'チャンネルは twitch.tv/{v} です。', game: '{v}を配信しています', rule: '。ルールは「{v}」です', tone: 'トーンは{v}で。', pieces: '{v}を入れてください。', and: '、' },
  },
  priv: {
    ey: 'プライバシー', t: 'データの扱いについて',
    items: [
      ['Claudeが見るもの', '公開されているTwitchチャンネル（プレイ中のゲーム、タイトル、チャットの雰囲気）。一般の視聴者が見られる情報だけで、パスワードやアカウント権限は不要です。'],
      ['PCに残るもの', 'パックはローカルファイルです。カウンターや設定はOBSのプロファイル内に保存されます。サーバーやアカウントはありません。'],
      ['OBSとの接続', 'OBS標準のWebSocketで、自分のPCかローカルネットワーク内だけで動きます。チャットは匿名で読み取ります。'],
    ],
  },
},
ko: {
  ctaDemo: '데모 체험하기 →', ctaWant: '내 채널용으로 갖고 싶어요 →',
  gen: {
    ey: '나만의 팩 만들기', t: '프롬프트를 대신 써 드려요', l: '방송에 대해 아는 걸 채우고 문장을 Claude에 붙여넣으세요. 구체적일수록 더 나다운 팩이 됩니다.',
    channel: 'Twitch 채널 (선택)', game: '방송에서 뭘 하나요?', gamePh: '다크 소울 첫 플레이, 뉴스 토크, 마인크래프트 하드코어…',
    rule: '규칙이나 컨셉이 있나요?', rulePh: '죽을 때마다 팔굽혀펴기 3개, 7일 서브어손…',
    tone: '톤', tones: ['웅장한', '유쾌한', '편안한', '레트로', '미니멀'],
    cam: '카메라', cams: ['캠 사용', '버튜버', '캠 없음'],
    pieces: '원하는 요소', pieceList: ['데스 카운터', '보스 트래커', '주제 목록', '일수 카운터', '구독 목표', '서브어손 타이머'],
    out: '내 프롬프트', copy: '프롬프트 복사', copied: '복사됨!', next: '이제 스킬 설치 ↓',
    p: { open: 'OBS 오버레이 팩 만들어줘.', channel: '내 채널은 twitch.tv/{v} 야.', game: '{v} 방송을 해', rule: '. 규칙은 "{v}"야', tone: '{v} 톤으로 해줘.', pieces: '{v}을(를) 넣어줘.', and: ', ' },
  },
  priv: {
    ey: '개인정보', t: '내 데이터는 어떻게 되나요',
    items: [
      ['Claude가 보는 것', '공개 Twitch 채널(플레이하는 게임, 방송 제목, 채팅 분위기). 일반 시청자가 보는 정보뿐이며 비밀번호나 계정 권한은 필요 없습니다.'],
      ['내 컴퓨터에 남는 것', '팩은 로컬 파일입니다. 카운터와 설정은 OBS 프로필에 저장됩니다. 서버도 계정도 없습니다.'],
      ['OBS 연결 방식', 'OBS 기본 WebSocket으로 내 컴퓨터나 로컬 네트워크 안에서만 연결됩니다. 채팅은 익명으로 읽습니다.'],
    ],
  },
},
zh: {
  ctaDemo: '试用演示 →', ctaWant: '我也想要一套这样的 →',
  gen: {
    ey: '定制你的', t: '我们帮你写好提示词', l: '填写你了解的直播信息，然后把这段话粘贴到 Claude。越具体，素材包就越像你。',
    channel: '你的 Twitch 频道（可选）', game: '你直播什么？', gamePh: '第一次玩黑暗之魂、新闻闲聊、我的世界极限模式……',
    rule: '有什么规则或玩法？', rulePh: '每死一次做 3 个俯卧撑、7 天订阅马拉松……',
    tone: '风格', tones: ['史诗', '搞笑', '轻松', '复古', '极简'],
    cam: '摄像头', cams: ['真人出镜', '虚拟主播', '不出镜'],
    pieces: '想要的部件', pieceList: ['死亡计数器', 'Boss 追踪', '话题列表', '天数计数器', '订阅目标', '订阅马拉松计时器'],
    out: '你的提示词', copy: '复制提示词', copied: '已复制！', next: '接下来安装技能 ↓',
    p: { open: '帮我做一套 OBS 叠加层素材包。', channel: '我的频道是 twitch.tv/{v}。', game: '我直播{v}', rule: '，规则是：{v}', tone: '风格要{v}。', pieces: '希望包含：{v}。', and: '、' },
  },
  priv: {
    ey: '隐私', t: '你的数据会怎样',
    items: [
      ['Claude 会看什么', '你公开的 Twitch 频道：玩什么、直播标题和聊天氛围。和普通观众看到的一样，不需要密码或账号权限。'],
      ['留在你电脑上的', '素材包是本地文件，计数和设置保存在你的 OBS 配置里。没有服务器，也没有我们的账号。'],
      ['如何连接 OBS', '通过 OBS 自带的 WebSocket，仅在你的电脑或局域网内连接。聊天以匿名方式读取。'],
    ],
  },
},
};

module.exports = { CONV };
