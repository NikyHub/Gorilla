export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  console.log('[DEBUG] 收到登录请求:', { username, password });

  try {
    if (username === 'admin' && password === 'admin123') {
      return res.status(200).json({
        success: true,
        user: { username: 'admin', role: 'admin' }
      });
    } else {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    console.error('[ERROR] 登录错误:', err);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}