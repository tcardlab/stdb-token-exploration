export function Html(attrs: any, children: any) {
  return <>
    {`<!doctype html>`}
    <html>
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo="/>
        <link rel='stylesheet' href='/styles/base.css' />
      </head>
      <body>
        {children}
      </body>
    </html>
  </>;
}