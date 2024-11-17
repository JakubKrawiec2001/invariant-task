import { colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(() => ({
  dialog: {
    '& .MuiDialog-paper': {
      padding: '1em',
      borderRadius: '20px',
      backgroundColor: colors.invariant.component
    }
  },
  dialogTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  listItem: {
    color: colors.invariant.textGrey,
    fontSize: 18,
    lineHeight: '1.4'
  },
  listItemSpan: {
    textDecoration: 'underline',
    cursor: 'pointer',
    color: colors.invariant.pink,
    '&:hover': {
      color: colors.invariant.lightPink
    }
  },
  status: {
    fontSize: 19
  },
  statusActive: {
    color: colors.invariant.green
  },
  statusInactive: {
    color: colors.invariant.Error
  },
  closeBtn: {
    fontSize: '1em',
    color: 'white',
    '&:hover': {
      color: 'gray'
    }
  },
  popupText: {
    color: colors.invariant.textGrey,
    marginTop: '1em',
    fontSize: 18,
    lineHeight: '1.4'
  }
}))

export default useStyles
