# Release readiness checklist

> Template from QA Engineering Academy. Use it to prepare a go/no-go recommendation, not to replace one.

**Release:** | **Date:** | **Prepared by:**

## Evidence

- [ ] All planned high-risk scenarios executed, with results linked
- [ ] Regression run on the release candidate build (not an earlier one)
- [ ] Open defects reviewed: none critical; each high defect has an agreed decision
- [ ] Non-functional checks done where in scope (performance, security, accessibility)
- [ ] Data migrations rehearsed on production-like data
- [ ] Monitoring and alerts in place for the changed areas

## Operational readiness

- [ ] Rollback or feature-flag plan tested
- [ ] Support team briefed on changes and known issues
- [ ] Release notes reviewed

## Residual risk (in business terms)

| Risk | Who is affected | Likelihood | Mitigation |
| --- | --- | --- | --- |

## Recommendation

**Go / Go with conditions / No-go** because: _two or three sentences a non-tester can act on._
