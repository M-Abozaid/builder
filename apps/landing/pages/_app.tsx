// import '../src/wdyr'
import 'reflect-metadata'
import '../styles/app.css'
import '../styles/antd-theme.less'
// https://www.elvisduru.com/blog/how-to-customize-ant-design-theme-in-nextjs
import { UserProvider } from '@auth0/nextjs-auth0'
import { IAppProps } from '@codelab/frontend/abstract/core'
import type { CodelabPage } from '@codelab/frontend/abstract/types'
import { css, Global } from '@emotion/react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ConfigProvider } from 'antd'
import React, { PropsWithChildren } from 'react'
import { RecoilRoot } from 'recoil'
import { GlobalStyles } from 'twin.macro'
import { Intercom } from '../home/Intercom'
// import { slickCssFix } from '../src/styles/slick/Slick'

//
/**
 * Pass { snapshot: getSnapshot(store) } as props from any getServerSideProps to pre-populate the store
 */

const App = ({ pageProps, Component }: IAppProps) => {
  const { Layout = ({ children }: PropsWithChildren) => <>{children}</> } =
    Component as CodelabPage

  return (
    <>
      <Intercom />
      <RecoilRoot>
        <UserProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ConfigProvider>
              <GlobalStyles />
              <Global
                styles={[
                  css({
                    '#__next': {
                      height: '100%',
                    },
                  }),
                  css`
                    img,
                    svg,
                    video,
                    canvas,
                    audio,
                    iframe,
                    embed,
                    object {
                      display: inline;
                    }
                  `,
                ]}
              />
              <Layout>
                <Component
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...pageProps}
                />
              </Layout>
            </ConfigProvider>
          </LocalizationProvider>
        </UserProvider>
      </RecoilRoot>
    </>
  )
}

App.displayName = 'App'

export default App
