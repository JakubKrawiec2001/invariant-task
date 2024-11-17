import useStyles from './style'
import { Dialog, DialogTitle, DialogContent, Button, Typography, Box } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

type DialogPopupProps = {
  open: boolean
  onClose: () => void
  isIndexed: boolean | null
}

const JupiterPopup = ({ open, onClose, isIndexed }: DialogPopupProps) => {
  const { classes } = useStyles()
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth className={classes.dialog}>
      <Box className={classes.dialogTitleContainer}>
        <DialogTitle className={classes.dialogTitle}>Jupiter Indexing</DialogTitle>
        <Button onClick={onClose} className={classes.closeBtn}>
          <CloseIcon />
        </Button>
      </Box>
      <DialogContent>
        <Typography variant='body2' className={classes.status}>
          Status:{' '}
          <span className={isIndexed ? classes.statusActive : classes.statusInactive}>
            {isIndexed ? 'Indexing active' : 'Indexing not active'}
          </span>
        </Typography>
        <Typography variant='body2' className={classes.popupText}>
          If a pool is not yet indexed, meeting three requirements will enable its indexing:
        </Typography>
        <ul>
          <li className={classes.listItem}>
            Ensure your token exists on-chain with metadata following the{' '}
            <span className={classes.listItemSpan}>Metaplex Token Metadata</span>
          </li>
          <li className={classes.listItem}>
            Maintain at least $250 liquidity on both buy and sell sides.
          </li>
          <li className={classes.listItem}>
            Limit buy and sell price impact to 30% to prevent single-sided liquidity markets.
          </li>
        </ul>
        <Typography variant='body2' className={classes.popupText}>
          Once these criteria are met, Jupiter automatically lists your token within minutes
          (usually up to ~30 min).
        </Typography>
      </DialogContent>
    </Dialog>
  )
}

export default JupiterPopup
