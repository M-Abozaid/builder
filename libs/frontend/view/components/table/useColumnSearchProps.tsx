import { SearchOutlined } from '@ant-design/icons'
import { Maybe } from '@codelab/shared/abstract/types'
import { Button, Input, InputRef, Space, TableColumnProps } from 'antd'
import type { FilterConfirmProps } from 'antd/es/table/interface'
import React, { useRef, useState } from 'react'

export const useColumnSearchProps = <RecordType extends object>(
  dataIndex: keyof RecordType,
) => {
  const [state, setState] = useState({
    searchText: '',
    searchedColumn: '',
  })

  const searchInputRef = useRef<null | InputRef>(null)

  const handleSearch = (
    selectedKeys: Array<React.Key>,
    confirm: (params: FilterConfirmProps) => void,
  ) => {
    confirm({ closeDropdown: false })
    setState({
      searchText: selectedKeys[0] as string,
      searchedColumn: dataIndex.toString(),
    })
  }

  const handleReset = (clearFilters: Maybe<() => void>) => {
    if (clearFilters !== undefined) {
      clearFilters()
    }

    setState({ searchText: '', searchedColumn: '' })
  }

  return {
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          onChange={(e) => {
            setSelectedKeys(e.target.value ? [e.target.value] : [])
            handleSearch(selectedKeys, confirm)
          }}
          onPressEnter={() => handleSearch(selectedKeys, confirm)}
          placeholder={`Search ${dataIndex.toString()}`}
          ref={(node) => {
            searchInputRef.current = node
          }}
          style={{ marginBottom: 8, display: 'block' }}
          value={selectedKeys[0]}
        />
        <Space>
          {/* <Button */}
          {/*  type="primary" */}
          {/*  onClick={() => handleSearch(selectedKeys, confirm)} */}
          {/*  icon={<SearchOutlined />} */}
          {/*  size="small" */}
          {/*  style={{ width: 90 }} */}
          {/* > */}
          {/*  Search */}
          {/* </Button> */}
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button */}
          {/*  type="link" */}
          {/*  size="small" */}
          {/*  onClick={() => { */}
          {/*    confirm({ closeDropdown: false }) */}
          {/*    setState({ */}
          {/*      searchText: selectedKeys[0] as string, */}
          {/*      searchedColumn: dataIndex, */}
          {/*    }) */}
          {/*  }} */}
          {/* > */}
          {/*  Filter */}
          {/* </Button> */}
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      `${record[dataIndex]}`
        .toLowerCase()
        .includes((value as string).toLowerCase()) || '',
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInputRef.current?.select(), 100)
      }
    },
  } as TableColumnProps<RecordType>
}
