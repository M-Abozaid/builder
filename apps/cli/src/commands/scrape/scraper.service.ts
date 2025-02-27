import fs from 'fs'
import { parse } from 'json2csv'
import puppeteer from 'puppeteer'

export interface AntdDesignApi {
  property: string
  description: string
  type: string
  default: string
  version: string
  isEnum: boolean
}

interface ComponentData {
  name: string
  props: Array<AntdDesignApi>
}

export const antdTableKeys: Array<keyof AntdDesignApi> = [
  'property',
  'description',
  'type',
  'default',
  'version',
]

const toSkip = new Set(['Message', 'Notification'])

export class ScraperService {
  public async scrape() {
    const browser = await puppeteer.launch({
      headless: true,
    })

    const page = await browser.newPage()
    await page.goto('https://ant.design/components/overview/', {
      waitUntil: 'networkidle2',
    })

    // Get all links of components
    const urls = (
      await page.evaluate(() =>
        Array.from<HTMLLinkElement, [string, HTMLLinkElement['href']]>(
          document.querySelectorAll(
            'section.main-menu-inner li[role="menuitem"] a',
          ),
          (link) => {
            const component = link.innerText

            return [component, link.href]
          },
        ),
      )
    )
      // This page has no components
      .filter(([component, href]) => !href.includes('components/overview'))
    // Use this for testing only
    // .slice(0, 1)

    console.log(`Found ${urls.length} links!`)

    const urlsMap = new Map(urls)
    let pagesCount = 1

    for (const [componentPage, url] of urlsMap.entries()) {
      if (toSkip.has(componentPage)) {
        continue
      }

      console.log('\n-----------------------------------')
      console.log(`Fetching [${pagesCount}/${urls.length}] ${componentPage}...`)
      await page.goto(url)

      const tableData: Array<ComponentData | undefined> = await page.evaluate(
        (_tableKeys, _pageName) => {
          const extractPropsFromTable = (tableToExtract: HTMLTableElement) => {
            const rows = Array.from<HTMLTableRowElement>(
              tableToExtract.querySelectorAll('tbody tr'),
            )

            return (
              rows
                .map((tr) => tr.querySelectorAll('td'))
                // some tables are missing version
                .filter((tableValues) => tableValues.length >= 4)
                .map((tableValues) => {
                  const typeTdChildren = Array.from(
                    tableValues[2]?.children ?? [],
                  ) as Array<Node>

                  const textTdContent = tableValues[2]?.textContent ?? ''

                  return {
                    [`${_tableKeys[0]}`]: tableValues[0]?.innerText,
                    [`${_tableKeys[1]}`]: tableValues[1]?.innerText,
                    [`${_tableKeys[2]}`]: tableValues[2]?.innerText,
                    [`${_tableKeys[3]}`]: tableValues[3]?.innerText,
                    // some tables are missing version
                    [`${_tableKeys[4]}`]: tableValues[4]?.innerText,
                    // Enums are displayed within a code block, we can recognize them by that
                    // if all children of type are in code blocks, we can say that the whole
                    // props in of enum type
                    isEnum:
                      typeTdChildren.length > 1 &&
                      typeTdChildren.every(
                        (child) => (child as HTMLElement).tagName === 'CODE',
                      ) &&
                      !/(function|=>|<)/g.test(textTdContent),
                  } as unknown as AntdDesignApi
                })
            )
          }

          const tables = document.querySelectorAll(
            'section.api-container table',
          )

          if (tables.length === 0) {
            // No tables?
            return []
          }

          if (tables.length === 1) {
            // Single table
            return [
              {
                name: _pageName,
                props: extractPropsFromTable(tables[0] as HTMLTableElement),
              },
            ]
          }

          // Multiple tables (components)
          return Array.from(tables).map((table) => {
            let name: string | undefined = undefined

            if (table.tagName !== 'TABLE') {
              return
            }

            const checkPrevSibling = (el: HTMLElement, triesLeft: number) => {
              if (triesLeft <= 0 || !el.previousSibling) {
                return
              }

              if ((el.previousSibling as HTMLElement).tagName === 'H3') {
                name = (el.previousSibling.firstChild as HTMLElement).innerText

                return
              }

              checkPrevSibling(el.previousSibling as HTMLElement, triesLeft - 1)
            }

            checkPrevSibling(table as HTMLElement, 3)

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!name) {
              return
            }

            return {
              name,
              props: extractPropsFromTable(table as HTMLTableElement),
            }
          })
        },
        antdTableKeys,
        componentPage,
      )

      try {
        tableData
          .filter((d): d is ComponentData => Boolean(d))
          .filter((d) => d.props.length > 0)
          .forEach(({ name, props }) => {
            const csv = parse(props, {
              fields: [...antdTableKeys, 'isEnum'],
            })

            const componentName =
              name === 'API' || componentPage === name
                ? undefined
                : name.replace('/', '_')

            console.log(csv)
            fs.writeFileSync(
              `${process.cwd()}/data/antd/${componentPage}${
                componentName ? '--' + componentName : ''
              }.csv`,
              csv,
            )
          })
      } catch (err) {
        console.error(err)
      }

      pagesCount++
    }

    await browser.close()
  }
}
